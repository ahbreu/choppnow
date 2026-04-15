import { CartState } from "../../data/commerce";
import { UserProfile } from "../../data/users";

export const CART_STORAGE_KEY_PREFIX = "choppnow-cart";

export function getCartStorageKey(userId: string) {
  return `${CART_STORAGE_KEY_PREFIX}:${userId}`;
}

export function isPersistedCartState(value: unknown): value is CartState {
  if (!value || typeof value !== "object") return false;
  const cart = value as CartState;
  return (
    (typeof cart.storeId === "string" || cart.storeId === null) &&
    (typeof cart.storeName === "string" || cart.storeName === null) &&
    Array.isArray(cart.items)
  );
}

export async function loadBuyerCart(user: UserProfile | null) {
  if (!user || user.role !== "buyer") return null;
  const { getItem } = await import("../../utils/storage");
  const stored = await getItem<CartState>(getCartStorageKey(user.id));
  return isPersistedCartState(stored) ? stored : null;
}

export async function persistBuyerCart(user: UserProfile | null, cart: CartState) {
  if (!user || user.role !== "buyer") return;
  const { removeItem, saveItem } = await import("../../utils/storage");
  if (cart.items.length === 0) {
    await removeItem(getCartStorageKey(user.id));
    return;
  }
  await saveItem(getCartStorageKey(user.id), cart);
}
