import test from "node:test";
import assert from "node:assert/strict";
import { getCartStorageKey, isPersistedCartState } from "../src/services/cart/storage";

test("cart storage key is namespaced per user", () => {
  assert.equal(getCartStorageKey("user-pedro"), "choppnow-cart:user-pedro");
});

test("persisted cart validator accepts cart-like payloads", () => {
  assert.equal(
    isPersistedCartState({
      storeId: "1",
      storeName: "Apoena",
      items: [],
    }),
    true
  );
});

test("persisted cart validator rejects malformed payloads", () => {
  assert.equal(
    isPersistedCartState({
      storeId: 1,
      storeName: "Apoena",
      items: [],
    }),
    false
  );
});
