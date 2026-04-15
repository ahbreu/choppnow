import type { CheckoutDraft } from "../../data/commerce";
import type { OrderStatusCode } from "../../data/orders";
import type {
  BackendEntityId,
  BackendListResponse,
  IsoDateTimeString,
} from "./common";

export const ORDERS_PATH = "/v1/orders";
export const BUYER_ORDERS_PATH = "/v1/orders/my";
export const SELLER_ORDERS_PATH = "/v1/seller/orders";
export const ORDER_STATUS_BY_ID_PATH = "/v1/orders/:id/status";

export type OrderPaymentMethod = CheckoutDraft["paymentMethod"];

export type CreateOrderItemAddOnRequest = {
  id: string;
  quantity: number;
};

export type CreateOrderItemRequest = {
  beerId: BackendEntityId;
  quantity: number;
  addOns?: CreateOrderItemAddOnRequest[];
};

export type CreateOrderRequest = {
  storeId: BackendEntityId;
  items: CreateOrderItemRequest[];
  paymentMethod: OrderPaymentMethod;
  deliveryAddress: string;
  deliveryNotes: string;
  couponCode?: string;
};

export type OrderTotalsContract = {
  currency: "BRL";
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
};

export type OrderItemContract = {
  beerId: BackendEntityId;
  quantity: number;
  addOns?: CreateOrderItemAddOnRequest[];
};

export type OrderContract = {
  id: BackendEntityId;
  buyerId: BackendEntityId;
  storeId: BackendEntityId;
  items: OrderItemContract[];
  totals: OrderTotalsContract;
  createdAt: IsoDateTimeString;
  status: OrderStatusCode;
  slaMinutes: number;
  checkoutReference?: string;
  buyerNotificationsEnabled: boolean;
};

export type CreateOrderResponse = {
  order: OrderContract;
};

export type BuyerOrdersResponse = BackendListResponse<OrderContract>;
export type SellerOrdersResponse = BackendListResponse<OrderContract>;

export type UpdateOrderStatusRequest = {
  status: OrderStatusCode;
};

export type UpdateOrderStatusResponse = {
  order: OrderContract;
  changedAt: IsoDateTimeString;
};
