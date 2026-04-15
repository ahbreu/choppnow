import test from "node:test";
import assert from "node:assert/strict";
import { demoAuthGateway } from "../src/services/auth/demo";

test("demo auth accepts normalized e-mail login", () => {
  const user = demoAuthGateway.signInWithEmail("PEDRO@CHOPPNOW.APP", "pedro123");

  assert.ok(user);
  assert.equal(user?.id, "user-pedro");
  assert.equal(user?.role, "buyer");
});

test("demo auth resolves seller by store id", () => {
  const seller = demoAuthGateway.getSellerUserByStoreId("1");

  assert.ok(seller);
  assert.equal(seller?.id, "user-apoena");
});

test("demo accounts list returns configured accounts", () => {
  const accounts = demoAuthGateway.listDemoAccounts();

  assert.equal(accounts.length >= 2, true);
  assert.equal(accounts[0]?.email.length > 0, true);
});
