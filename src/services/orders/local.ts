import { CartState, CheckoutDraft, formatCurrency, getCartSubtotal, getCheckoutTotals } from "../../data/commerce";
import {
  getDefaultNextOrderStatus,
  getOrderStateModel,
  isOrderTransitionAllowed,
  OperationalNotification,
  OrderItemRecord,
  OrderStatusCode,
} from "../../data/orders";
import { UserProfile } from "../../data/users";
import { demoAuthGateway } from "../auth/demo";
import {
  AdvanceOrderPayload,
  AdvanceOrderResult,
  OrdersGateway,
  OrdersGatewayError,
  PlaceOrderPayload,
  PlaceOrderResult,
} from "./gateway";
import { localCheckoutGateway } from "../checkout/local";

type NotificationAudience = Pick<UserProfile, "id" | "notificationsEnabled"> | null | undefined;

type NotificationAudienceMap = {
  buyer?: NotificationAudience;
  seller?: NotificationAudience;
};

function formatNotificationTime() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOrderCreatedAt() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function createOperationalNotifications(
  order: OrderItemRecord,
  nextStatus: OrderStatusCode,
  audiences: NotificationAudienceMap = {}
): OperationalNotification[] {
  const buyer =
    audiences.buyer ?? {
      id: order.buyerId,
      notificationsEnabled: order.buyerNotificationsEnabled ?? true,
    };
  const seller = audiences.seller ?? demoAuthGateway.getSellerUserByStoreId(order.storeId);
  const nextState = getOrderStateModel(nextStatus);
  const createdAt = formatNotificationTime();

  const nextNotifications: OperationalNotification[] = [];

  if (buyer) {
    nextNotifications.push({
      id: `${order.id}-buyer-${Date.now()}`,
      orderId: order.id,
      audienceUserId: buyer.id,
      status: nextStatus,
      title: `Pedido #${order.id} - ${nextState.customerLabel}`,
      message: nextState.customerMessage,
      channel: buyer.notificationsEnabled ? "push" : "in_app",
      createdAt,
    });
  }

  if (seller) {
    nextNotifications.push({
      id: `${order.id}-seller-${Date.now()}`,
      orderId: order.id,
      audienceUserId: seller.id,
      status: nextStatus,
      title: `Pedido #${order.id} - ${nextState.partnerLabel}`,
      message: nextState.partnerMessage,
      channel: seller.notificationsEnabled ? "push" : "in_app",
      createdAt,
    });
  }

  return nextNotifications;
}

export function buildLocalOrderRecord({
  buyer,
  cart,
  draft,
  storeId,
}: PlaceOrderPayload, options?: { checkoutReference?: string }): OrderItemRecord {
  if (buyer.role !== "buyer") {
    throw new OrdersGatewayError("invalid_buyer", "Somente compradores podem criar pedidos.");
  }
  if (!cart.storeId || cart.items.length === 0) {
    throw new OrdersGatewayError("invalid_cart", "Carrinho invalido para criacao de pedido.");
  }

  const subtotal = getCartSubtotal(cart);
  const { total } = getCheckoutTotals(subtotal, cart.items.length > 0);
  const formattedTotal = formatCurrency(total);
  const slaMinutes = draft.paymentMethod === "pix" ? 35 : 40;

  return {
    id: `order-${Date.now()}`,
    buyerId: buyer.id,
    storeId,
    items: cart.items.map((item) => ({
      beerId: item.beerId,
      quantity: item.quantity,
    })),
    total: formattedTotal,
    createdAt: formatOrderCreatedAt(),
    slaMinutes,
    status: "placed",
    checkoutReference: options?.checkoutReference,
    buyerNotificationsEnabled: buyer.notificationsEnabled,
  };
}

function ensureSellerContext(user: UserProfile) {
  if (user.role !== "seller" || !user.sellerStoreId) {
    throw new OrdersGatewayError("seller_forbidden", "Somente a cervejaria responsavel pode alterar este pedido.");
  }
}

function resolveNextOrderStatus(currentOrder: OrderItemRecord, targetStatus?: OrderStatusCode) {
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
  return nextStatus;
}

async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  const { buyer, cart, draft, storeId } = payload;
  const checkoutResult = await localCheckoutGateway.submitCheckout(cart, draft);
  const seller = demoAuthGateway.getSellerUserByStoreId(storeId);
  const order = buildLocalOrderRecord({
    buyer,
    cart,
    draft,
    storeId,
  }, {
    checkoutReference: checkoutResult.placeholderReference,
  });

  return {
    order,
    notifications: createOperationalNotifications(order, "placed", {
      buyer,
      seller,
    }),
    checkoutReference: checkoutResult.placeholderReference,
  };
}

function advanceOrder(payload: AdvanceOrderPayload): AdvanceOrderResult {
  const { currentUser, orders, orderId, targetStatus } = payload;
  ensureSellerContext(currentUser);

  const currentOrder = orders.find(
    (order) => order.id === orderId && order.storeId === currentUser.sellerStoreId
  );

  if (!currentOrder) {
    throw new OrdersGatewayError("order_not_found", "Este pedido nao esta disponivel para sua loja.");
  }

  const nextStatus = resolveNextOrderStatus(currentOrder, targetStatus);
  const updatedOrder: OrderItemRecord = { ...currentOrder, status: nextStatus };

  return {
    updatedOrder,
    notifications: createOperationalNotifications(updatedOrder, nextStatus, {
      buyer: {
        id: updatedOrder.buyerId,
        notificationsEnabled: updatedOrder.buyerNotificationsEnabled ?? true,
      },
      seller: currentUser,
    }),
  };
}

export const localOrdersGateway: OrdersGateway = {
  placeOrder,
  advanceOrder,
};
