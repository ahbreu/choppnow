import { CartState, CheckoutDraft } from "../../data/commerce";
import { OperationalNotification, OrderItemRecord, OrderStatusCode } from "../../data/orders";
import { UserProfile } from "../../data/users";

export type OrdersGatewayErrorCode =
  | "invalid_buyer"
  | "invalid_cart"
  | "seller_forbidden"
  | "order_not_found"
  | "terminal_order"
  | "invalid_transition";

export class OrdersGatewayError extends Error {
  code: OrdersGatewayErrorCode;

  constructor(code: OrdersGatewayErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "OrdersGatewayError";
  }
}

export type PlaceOrderPayload = {
  buyer: UserProfile;
  cart: CartState;
  draft: CheckoutDraft;
  storeId: string;
};

export type PlaceOrderResult = {
  order: OrderItemRecord;
  notifications: OperationalNotification[];
  checkoutReference: string;
};

export type AdvanceOrderPayload = {
  currentUser: UserProfile;
  orders: OrderItemRecord[];
  orderId: string;
  targetStatus?: OrderStatusCode;
};

export type AdvanceOrderResult = {
  updatedOrder: OrderItemRecord;
  notifications: OperationalNotification[];
};

export interface OrdersGateway {
  placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult>;
  advanceOrder(payload: AdvanceOrderPayload): Promise<AdvanceOrderResult>;
}
