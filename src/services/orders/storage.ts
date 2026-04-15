import {
  initialOrders,
  OperationalNotification,
  OrderItemRecord,
  OrderStatusCode,
} from "../../data/orders";

export const ORDERS_RUNTIME_STORAGE_KEY = "choppnow-orders-runtime";
export const MAX_OPERATIONAL_NOTIFICATIONS = 30;

export type OrdersRuntimeState = {
  orders: OrderItemRecord[];
  notifications: OperationalNotification[];
  sellerAvailability: Record<string, boolean>;
};

const ORDER_STATUS_CODES: OrderStatusCode[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOrderStatusCode(value: unknown): value is OrderStatusCode {
  return typeof value === "string" && ORDER_STATUS_CODES.includes(value as OrderStatusCode);
}

function isOrderItem(value: unknown) {
  if (!isPlainObject(value)) return false;

  return typeof value.beerId === "string" && typeof value.quantity === "number";
}

function isOrderItemRecord(value: unknown): value is OrderItemRecord {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.buyerId === "string" &&
    typeof value.storeId === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItem) &&
    typeof value.total === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.slaMinutes === "number" &&
    isOrderStatusCode(value.status) &&
    (typeof value.checkoutReference === "string" || typeof value.checkoutReference === "undefined") &&
    (typeof value.buyerNotificationsEnabled === "boolean" ||
      typeof value.buyerNotificationsEnabled === "undefined")
  );
}

function isNotificationChannel(value: unknown) {
  return value === "push" || value === "in_app";
}

function isOperationalNotification(value: unknown): value is OperationalNotification {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.orderId === "string" &&
    typeof value.audienceUserId === "string" &&
    isOrderStatusCode(value.status) &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    isNotificationChannel(value.channel) &&
    typeof value.createdAt === "string"
  );
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  if (!isPlainObject(value)) return false;

  return Object.values(value).every((entry) => typeof entry === "boolean");
}

export function isPersistedOrdersRuntimeState(value: unknown): value is OrdersRuntimeState {
  if (!isPlainObject(value)) return false;

  return (
    Array.isArray(value.orders) &&
    value.orders.every(isOrderItemRecord) &&
    Array.isArray(value.notifications) &&
    value.notifications.every(isOperationalNotification) &&
    isBooleanRecord(value.sellerAvailability)
  );
}

export function mergeSellerAvailability(
  base: Record<string, boolean>,
  overrides: Record<string, boolean>
) {
  return {
    ...base,
    ...overrides,
  };
}

export function createInitialOrdersRuntimeState(
  initialSellerAvailability: Record<string, boolean>
): OrdersRuntimeState {
  return {
    orders: initialOrders,
    notifications: [],
    sellerAvailability: { ...initialSellerAvailability },
  };
}

export function prependOperationalNotifications(
  current: OperationalNotification[],
  next: OperationalNotification[]
) {
  return [...next, ...current].slice(0, MAX_OPERATIONAL_NOTIFICATIONS);
}

export function upsertRuntimeOrder(orders: OrderItemRecord[], updatedOrder: OrderItemRecord) {
  const hasExistingOrder = orders.some((order) => order.id === updatedOrder.id);

  if (!hasExistingOrder) {
    return [updatedOrder, ...orders];
  }

  return orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order));
}

function normalizeOrdersRuntimeState(
  state: OrdersRuntimeState,
  initialSellerAvailability: Record<string, boolean>
): OrdersRuntimeState {
  return {
    orders: state.orders,
    notifications: state.notifications.slice(0, MAX_OPERATIONAL_NOTIFICATIONS),
    sellerAvailability: mergeSellerAvailability(initialSellerAvailability, state.sellerAvailability),
  };
}

async function loadStorageModule() {
  return import("../../utils/storage");
}

export async function loadOrdersRuntimeState(
  initialSellerAvailability: Record<string, boolean>
) {
  const { getItem } = await loadStorageModule();
  const stored = await getItem<unknown>(ORDERS_RUNTIME_STORAGE_KEY);

  if (!isPersistedOrdersRuntimeState(stored)) {
    return createInitialOrdersRuntimeState(initialSellerAvailability);
  }

  return normalizeOrdersRuntimeState(stored, initialSellerAvailability);
}

export async function persistOrdersRuntimeState(state: OrdersRuntimeState) {
  const { saveItem } = await loadStorageModule();
  await saveItem(ORDERS_RUNTIME_STORAGE_KEY, state);
}
