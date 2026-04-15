import { CartState, CheckoutDraft, getCheckoutTotals, getCartSubtotal } from "../../data/commerce";
import { CheckoutGateway, LocalCheckoutPayload, LocalCheckoutResult } from "./gateway";

async function submitLocalCheckout(cart: CartState, draft: CheckoutDraft): Promise<LocalCheckoutResult> {
  if (!cart.storeId || !cart.storeName || cart.items.length === 0) {
    throw new Error("Carrinho invalido para checkout.");
  }

  const subtotal = getCartSubtotal(cart);
  const { deliveryFee, serviceFee, total } = getCheckoutTotals(subtotal, cart.items.length > 0);

  const payload: LocalCheckoutPayload = {
    storeId: cart.storeId,
    storeName: cart.storeName,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    paymentMethod: draft.paymentMethod,
    couponCode: draft.couponCode,
    deliveryNotes: draft.deliveryNotes,
    subtotal,
    deliveryFee,
    serviceFee,
    total,
  };

  await new Promise((resolve) => setTimeout(resolve, 350));

  return {
    payload,
    placeholderReference: `LOCAL-${Date.now()}`,
  };
}

export const localCheckoutGateway: CheckoutGateway = {
  submitCheckout: submitLocalCheckout,
};
