import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthSession,
  createGoogleBuyerProfile,
  isPersistedAuthSession,
} from "../src/services/auth/session";

test("google identity is mapped into a buyer profile for the app", () => {
  const user = createGoogleBuyerProfile({
    id: "google-user-1",
    email: "Buyer@Example.com",
    name: "Buyer Example",
  });

  assert.equal(user.id, "google:google-user-1");
  assert.equal(user.email, "buyer@example.com");
  assert.equal(user.role, "buyer");
  assert.equal(user.avatarInitials, "BE");
  assert.equal(user.notificationsEnabled, true);
});

test("persisted auth session validator accepts a normalized auth session", () => {
  const session = createAuthSession("demo", {
    id: "user-pedro",
    email: "pedro@choppnow.app",
    password: "pedro123",
    name: "Pedro",
    role: "buyer",
    avatarInitials: "PE",
    headline: "Comprador tester do app",
    phone: "(61) 99999-1000",
    address: "SQS 308, Asa Sul - Brasilia, DF",
    favoriteBeerIds: [],
    favoriteStoreIds: [],
    notificationsEnabled: true,
  });

  assert.equal(isPersistedAuthSession(session), true);
});

test("persisted auth session validator rejects invalid providers", () => {
  assert.equal(
    isPersistedAuthSession({
      provider: "guest",
      user: {
        id: "user-pedro",
        email: "pedro@choppnow.app",
        password: "pedro123",
        name: "Pedro",
        role: "buyer",
        avatarInitials: "PE",
        headline: "Comprador tester do app",
        phone: "(61) 99999-1000",
        address: "SQS 308, Asa Sul - Brasilia, DF",
        favoriteBeerIds: [],
        favoriteStoreIds: [],
        notificationsEnabled: true,
      },
    }),
    false
  );
});
