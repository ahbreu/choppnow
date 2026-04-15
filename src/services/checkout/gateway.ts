import { CartState, CheckoutDraft } from "../../data/commerce";

export type LocalCheckoutPayload = {
  storeId: string;
  storeName: string;
  itemCount: number;
  paymentMethod: CheckoutDraft["paymentMethod"];
  couponCode: string;
  deliveryNotes: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
};

export type LocalCheckoutResult = {
  payload: LocalCheckoutPayload;
  placeholderReference: string;
};

export interface CheckoutGateway {
  submitCheckout(cart: CartState, draft: CheckoutDraft): Promise<LocalCheckoutResult>;
}
