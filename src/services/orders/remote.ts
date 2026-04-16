import { formatCurrency } from "../../data/commerce";
import {
  getDefaultNextOrderStatus,
  isOrderTransitionAllowed,
  OrderItemRecord,
  OrderStatusCode,
} from "../../data/orders";
import { UserProfile } from "../../data/users";
import { demoAuthGateway } from "../auth/demo";
import {
  BUYER_ORDERS_PATH,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderContract,
  ORDERS_PATH,
  ORDER_STATUS_BY_ID_PATH,
  SELLER_ORDERS_PATH,
  UpdateOrderStatusResponse,
} from "../contracts/orders";
import { PlaceOrderPayload, PlaceOrderResult, AdvanceOrderPayload, AdvanceOrderResult, OrdersGatewayError } from "./gateway";
import { createOperationalNotifications } from "./local";
import { upsertRuntimeOrder } from "./storage";

export const ORDERS_USER_ID_HEADER = "x-choppnow-user-id";
export const ORDERS_USER_ROLE_HEADER = "x-choppnow-user-role";
export const ORDERS_USER_EMAIL_HEADER = "x-choppnow-user-email";
export const ORDERS_STORE_ID_HEADER = "x-choppnow-store-id";

const ORDER_STATUS_CODES: OrderStatusCode[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const ORDERS_API_BASE_URL =
  process.env.EXPO_PUBLIC_ORDERS_API_BASE_URL?.trim() ||
  process.env.EXPO_PUBLIC_CATALOG_API_BASE_URL?.trim() ||
  "";
const DEFAULT_ORDERS_API_TIMEOUT_MS = 4500;

function readNumericEnv(rawValue: string | undefined, fallback: number, min: number, max: number) {
  if (!rawValue || rawValue.trim().length === 0) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

const ORDERS_API_TIMEOUT_MS = readNumericEnv(
  process.env.EXPO_PUBLIC_ORDERS_API_TIMEOUT_MS,
  DEFAULT_ORDERS_API_TIMEOUT_MS,
  1000,
  20000
);

export type RemoteOrdersGatewayErrorCode =
  | "api_not_configured"
  | "network_error"
  | "backend_rejected"
  | "http_error"
  | "invalid_payload";

export class RemoteOrdersGatewayError extends Error {
  code: RemoteOrdersGatewayErrorCode;
  status?: number;

  constructor(code: RemoteOrdersGatewayErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "RemoteOrdersGatewayError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOrderStatusCode(value: unknown): value is OrderStatusCode {
  return typeof value === "string" && ORDER_STATUS_CODES.includes(value as OrderStatusCode);
}

function isOrderItemContract(value: unknown) {
  if (!isPlainObject(value)) return false;
  const addOns = value.addOns;

  return (
    typeof value.beerId === "string" &&
    typeof value.quantity === "number" &&
    (typeof addOns === "undefined" ||
      (Array.isArray(addOns) &&
        addOns.every(
          (addOn) =>
            isPlainObject(addOn) &&
            typeof addOn.id === "string" &&
            typeof addOn.quantity === "number"
        )))
  );
}

function isOrderContract(value: unknown): value is OrderContract {
  if (!isPlainObject(value) || !isPlainObject(value.totals)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.buyerId === "string" &&
    typeof value.storeId === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItemContract) &&
    value.totals.currency === "BRL" &&
    typeof value.totals.subtotal === "number" &&
    typeof value.totals.deliveryFee === "number" &&
    typeof value.totals.serviceFee === "number" &&
    typeof value.totals.total === "number" &&
    typeof value.createdAt === "string" &&
    isOrderStatusCode(value.status) &&
    typeof value.slaMinutes === "number" &&
    (typeof value.checkoutReference === "string" || typeof value.checkoutReference === "undefined") &&
    typeof value.buyerNotificationsEnabled === "boolean"
  );
}

function formatRemoteOrderCreatedAt(createdAt: string) {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return createdAt;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function buildOrdersContextHeaders(user: UserProfile) {
  return {
    [ORDERS_USER_ID_HEADER]: user.id,
    [ORDERS_USER_ROLE_HEADER]: user.role,
    [ORDERS_USER_EMAIL_HEADER]: user.email,
    ...(user.sellerStoreId ? { [ORDERS_STORE_ID_HEADER]: user.sellerStoreId } : {}),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = ORDERS_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      message.includes("failed to fetch") ||
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("aborted")
    ) {
      throw new RemoteOrdersGatewayError("network_error", error instanceof Error ? error.message : "Network error.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseErrorPayload(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message =
      typeof payload.message === "string" && payload.message.trim().length > 0
        ? payload.message
        : null;
    return message;
  } catch {
    return null;
  }
}

function ensureOrdersApiConfigured() {
  if (!ORDERS_API_BASE_URL) {
    throw new RemoteOrdersGatewayError(
      "api_not_configured",
      "Orders API base URL is not configured."
    );
  }
}

function resolveAdvanceOrderTarget(payload: AdvanceOrderPayload) {
  const { currentUser, orders, orderId, targetStatus } = payload;

  if (currentUser.role !== "seller" || !currentUser.sellerStoreId) {
    throw new OrdersGatewayError("seller_forbidden", "Somente a cervejaria responsavel pode alterar este pedido.");
  }

  const currentOrder = orders.find(
    (order) => order.id === orderId && order.storeId === currentUser.sellerStoreId
  );

  if (!currentOrder) {
    throw new OrdersGatewayError("order_not_found", "Este pedido nao esta disponivel para sua loja.");
  }

  const nextStatus = targetStatus ?? getDefaultNextOrderStatus(currentOrder.status);
  if (!nextStatus) {
    throw new OrdersGatewayError("terminal_order", "Este pedido ja esta em estado terminal.");
  }
  if (!isOrderTransitionAllowed(currentOrder.status, nextStatus)) {
    throw new OrdersGatewayError(
      "invalid_transition",
      `Transicao invalida: ${currentOrder.status} -> ${nextStatus}.`
    );
  }

  return {
    currentOrder,
    nextStatus,
  };
}

export function buildCreateOrderRequest(payload: PlaceOrderPayload): CreateOrderRequest {
  const { buyer, cart, draft, storeId } = payload;

  if (buyer.role !== "buyer") {
    throw new OrdersGatewayError("invalid_buyer", "Somente compradores podem criar pedidos.");
  }
  if (!cart.storeId || cart.items.length === 0) {
    throw new OrdersGatewayError("invalid_cart", "Carrinho invalido para criacao de pedido.");
  }

  return {
    storeId,
    items: cart.items.map((item) => ({
      beerId: item.beerId,
      quantity: item.quantity,
      ...(item.addOns.length > 0
        ? {
            addOns: item.addOns.map((addOn) => ({
              id: addOn.id,
              quantity: addOn.quantity,
            })),
          }
        : {}),
    })),
    paymentMethod: draft.paymentMethod,
    deliveryAddress: buyer.address,
    deliveryNotes: draft.deliveryNotes.trim(),
    ...(draft.couponCode.trim().length > 0 ? { couponCode: draft.couponCode.trim() } : {}),
  };
}

export function mapOrderContractToRecord(order: OrderContract): OrderItemRecord {
  return {
    id: order.id,
    buyerId: order.buyerId,
    storeId: order.storeId,
    items: order.items.map((item) => ({
      beerId: item.beerId,
      quantity: item.quantity,
    })),
    total: formatCurrency(order.totals.total),
    createdAt: formatRemoteOrderCreatedAt(order.createdAt),
    slaMinutes: order.slaMinutes,
    status: order.status,
    checkoutReference: order.checkoutReference,
    buyerNotificationsEnabled: order.buyerNotificationsEnabled,
  };
}

export function extractCreateOrderResponse(payload: unknown): CreateOrderResponse | null {
  if (!isPlainObject(payload) || !isOrderContract(payload.order)) return null;
  return {
    order: payload.order,
  };
}

export function extractUpdateOrderStatusResponse(payload: unknown): UpdateOrderStatusResponse | null {
  if (!isPlainObject(payload) || !isOrderContract(payload.order) || typeof payload.changedAt !== "string") {
    return null;
  }

  return {
    order: payload.order,
    changedAt: payload.changedAt,
  };
}

export function extractOrderListResponse(payload: unknown): OrderContract[] | null {
  if (!isPlainObject(payload) || !Array.isArray(payload.items) || typeof payload.total !== "number") {
    return null;
  }

  if (!payload.items.every(isOrderContract)) {
    return null;
  }

  return payload.items;
}

export function mergeRemoteOrdersIntoRuntime(
  currentOrders: OrderItemRecord[],
  remoteOrders: OrderItemRecord[]
) {
  return remoteOrders
    .slice()
    .reverse()
    .reduce((orders, remoteOrder) => upsertRuntimeOrder(orders, remoteOrder), currentOrders);
}

export function shouldFallbackToLocalOrders(error: unknown) {
  return (
    error instanceof RemoteOrdersGatewayError &&
    (error.code === "api_not_configured" || error.code === "network_error")
  );
}

export async function placeOrderRemoteFirst(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  ensureOrdersApiConfigured();

  const response = await fetchWithTimeout(`${ORDERS_API_BASE_URL}${ORDERS_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...buildOrdersContextHeaders(payload.buyer),
    },
    body: JSON.stringify(buildCreateOrderRequest(payload)),
  });

  if (!response.ok) {
    const message = (await parseErrorPayload(response)) ?? `Orders API returned ${response.status}`;
    throw new RemoteOrdersGatewayError(
      response.status >= 400 && response.status < 500 ? "backend_rejected" : "http_error",
      message,
      response.status
    );
  }

  const parsed = extractCreateOrderResponse((await response.json()) as unknown);
  if (!parsed) {
    throw new RemoteOrdersGatewayError("invalid_payload", "Orders API returned an invalid create payload.");
  }

  const order = mapOrderContractToRecord(parsed.order);
  const seller = demoAuthGateway.getSellerUserByStoreId(order.storeId);

  return {
    order,
    notifications: createOperationalNotifications(order, order.status, {
      buyer: payload.buyer,
      seller,
    }),
    checkoutReference: order.checkoutReference ?? `REMOTE-${order.id}`,
  };
}

export async function advanceOrderRemoteFirst(payload: AdvanceOrderPayload): Promise<AdvanceOrderResult> {
  ensureOrdersApiConfigured();

  const { nextStatus } = resolveAdvanceOrderTarget(payload);
  const response = await fetchWithTimeout(
    `${ORDERS_API_BASE_URL}${ORDER_STATUS_BY_ID_PATH.replace(":id", payload.orderId)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...buildOrdersContextHeaders(payload.currentUser),
      },
      body: JSON.stringify({ status: nextStatus }),
    }
  );

  if (!response.ok) {
    const message = (await parseErrorPayload(response)) ?? `Orders API returned ${response.status}`;
    throw new RemoteOrdersGatewayError(
      response.status >= 400 && response.status < 500 ? "backend_rejected" : "http_error",
      message,
      response.status
    );
  }

  const parsed = extractUpdateOrderStatusResponse((await response.json()) as unknown);
  if (!parsed) {
    throw new RemoteOrdersGatewayError("invalid_payload", "Orders API returned an invalid update payload.");
  }

  const updatedOrder = mapOrderContractToRecord(parsed.order);

  return {
    updatedOrder,
    notifications: createOperationalNotifications(updatedOrder, updatedOrder.status, {
      buyer: {
        id: updatedOrder.buyerId,
        notificationsEnabled: updatedOrder.buyerNotificationsEnabled ?? true,
      },
      seller: payload.currentUser,
    }),
  };
}

export async function fetchOrdersForUserRemote(user: UserProfile) {
  ensureOrdersApiConfigured();

  const path = user.role === "seller" && user.sellerStoreId ? SELLER_ORDERS_PATH : BUYER_ORDERS_PATH;
  const response = await fetchWithTimeout(`${ORDERS_API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...buildOrdersContextHeaders(user),
    },
  });

  if (!response.ok) {
    const message = (await parseErrorPayload(response)) ?? `Orders API returned ${response.status}`;
    throw new RemoteOrdersGatewayError(
      response.status >= 400 && response.status < 500 ? "backend_rejected" : "http_error",
      message,
      response.status
    );
  }

  const parsed = extractOrderListResponse((await response.json()) as unknown);
  if (!parsed) {
    throw new RemoteOrdersGatewayError("invalid_payload", "Orders API returned an invalid list payload.");
  }

  return parsed.map(mapOrderContractToRecord);
}
