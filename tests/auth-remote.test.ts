import test from "node:test";
import assert from "node:assert/strict";
import { buildAuthSessionHeaders, createRemoteAuthSession } from "../src/services/auth/session";
import {
  extractAuthLoginResponse,
  extractAuthLogoutResponse,
  extractAuthMeResponse,
  mapBackendSessionUserToAuthUser,
  RemoteAuthError,
  shouldFallbackToLocalAuth,
} from "../src/services/auth/remote";

test("backend auth user is normalized into the app session profile", () => {
  const user = mapBackendSessionUserToAuthUser(
    {
      id: "seller-1",
      email: "SELLER@CHOPPNOW.APP",
      name: "Apoena Cervejaria",
      role: "seller",
      phone: "(61) 98888-2000",
      address: "CLS 112, Asa Sul - Brasilia, DF",
      notificationsEnabled: true,
      sellerStoreId: "1",
    },
    {
      password: "secret",
    }
  );

  assert.equal(user.email, "seller@choppnow.app");
  assert.equal(user.role, "seller");
  assert.equal(user.sellerStoreId, "1");
  assert.equal(user.password, "secret");
  assert.equal(user.avatarInitials, "AC");
});

test("auth payload extractors validate login, me and logout contracts", () => {
  const login = extractAuthLoginResponse({
    accessToken: "token-1",
    refreshToken: "refresh-1",
    expiresAt: "2026-04-16T12:00:00.000Z",
    user: {
      id: "user-pedro",
      email: "pedro@choppnow.app",
      name: "Pedro",
      role: "buyer",
      phone: "(61) 99999-1000",
      address: "SQS 308, Asa Sul - Brasilia, DF",
      notificationsEnabled: true,
    },
  });
  const me = extractAuthMeResponse({
    user: {
      id: "user-pedro",
      email: "pedro@choppnow.app",
      name: "Pedro",
      role: "buyer",
      phone: "(61) 99999-1000",
      address: "SQS 308, Asa Sul - Brasilia, DF",
      notificationsEnabled: true,
    },
  });
  const logout = extractAuthLogoutResponse({ success: true });

  assert.equal(login?.accessToken, "token-1");
  assert.equal(me?.user.id, "user-pedro");
  assert.deepEqual(logout, { success: true });
  assert.equal(extractAuthLoginResponse({ accessToken: "x" }), null);
});

test("remote auth session exposes bearer headers for downstream services", () => {
  const session = createRemoteAuthSession(
    {
      id: "user-pedro",
      email: "pedro@choppnow.app",
      password: "",
      name: "Pedro",
      role: "buyer",
      avatarInitials: "PE",
      headline: "Conta sincronizada com backend",
      phone: "(61) 99999-1000",
      address: "SQS 308, Asa Sul - Brasilia, DF",
      favoriteBeerIds: [],
      favoriteStoreIds: [],
      notificationsEnabled: true,
    },
    {
      accessToken: "token-123",
      refreshToken: "refresh-123",
      expiresAt: "2026-04-16T12:00:00.000Z",
    }
  );

  assert.deepEqual(buildAuthSessionHeaders(session), {
    Authorization: "Bearer token-123",
  });
});

test("shouldFallbackToLocalAuth only allows unavailable or network auth errors", () => {
  assert.equal(shouldFallbackToLocalAuth(new RemoteAuthError("api_not_configured", "no api")), true);
  assert.equal(shouldFallbackToLocalAuth(new RemoteAuthError("network_error", "fetch failed")), true);
  assert.equal(shouldFallbackToLocalAuth(new RemoteAuthError("backend_rejected", "bad creds")), false);
});
