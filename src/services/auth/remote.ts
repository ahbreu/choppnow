import {
  AUTH_LOGIN_PATH,
  AUTH_LOGOUT_PATH,
  AUTH_ME_PATH,
  AuthLoginResponse,
  AuthLogoutResponse,
  AuthMeResponse,
  BackendSessionUser,
} from "../contracts/auth";
import { AuthSession, AuthSessionUser } from "./gateway";
import { buildAuthSessionHeaders, createRemoteAuthSession } from "./session";

const AUTH_API_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_API_BASE_URL?.trim() ||
  process.env.EXPO_PUBLIC_ORDERS_API_BASE_URL?.trim() ||
  process.env.EXPO_PUBLIC_CATALOG_API_BASE_URL?.trim() ||
  "";
const DEFAULT_AUTH_API_TIMEOUT_MS = 4500;

function readNumericEnv(rawValue: string | undefined, fallback: number, min: number, max: number) {
  if (!rawValue || rawValue.trim().length === 0) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

const AUTH_API_TIMEOUT_MS = readNumericEnv(
  process.env.EXPO_PUBLIC_AUTH_API_TIMEOUT_MS,
  DEFAULT_AUTH_API_TIMEOUT_MS,
  1000,
  20000
);

export type RemoteAuthErrorCode =
  | "api_not_configured"
  | "network_error"
  | "backend_rejected"
  | "http_error"
  | "invalid_payload"
  | "expired_session";

export class RemoteAuthError extends Error {
  code: RemoteAuthErrorCode;
  status?: number;

  constructor(code: RemoteAuthErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "RemoteAuthError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildAvatarInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "AU";
}

function getRemoteHeadline(role: AuthSessionUser["role"]) {
  return role === "seller" ? "Sessao remota da cervejaria" : "Conta sincronizada com backend";
}

function isBackendSessionUser(value: unknown): value is BackendSessionUser {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.name === "string" &&
    (value.role === "buyer" || value.role === "seller") &&
    typeof value.phone === "string" &&
    typeof value.address === "string" &&
    typeof value.notificationsEnabled === "boolean" &&
    (typeof value.sellerStoreId === "string" || typeof value.sellerStoreId === "undefined")
  );
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = AUTH_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      message.includes("failed to fetch") ||
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("aborted")
    ) {
      throw new RemoteAuthError("network_error", error instanceof Error ? error.message : "Network error.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseErrorPayload(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    return typeof payload.message === "string" && payload.message.trim().length > 0
      ? payload.message
      : null;
  } catch {
    return null;
  }
}

function ensureAuthApiConfigured() {
  if (!AUTH_API_BASE_URL) {
    throw new RemoteAuthError("api_not_configured", "Auth API base URL is not configured.");
  }
}

export function mapBackendSessionUserToAuthUser(
  user: BackendSessionUser,
  options?: { password?: string }
): AuthSessionUser {
  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
    password: options?.password ?? "",
    name: user.name.trim(),
    role: user.role,
    avatarInitials: buildAvatarInitials(user.name),
    headline: getRemoteHeadline(user.role),
    phone: user.phone,
    address: user.address,
    favoriteBeerIds: [],
    favoriteStoreIds: [],
    notificationsEnabled: user.notificationsEnabled,
    ...(user.sellerStoreId ? { sellerStoreId: user.sellerStoreId } : {}),
  };
}

export function extractAuthLoginResponse(payload: unknown): AuthLoginResponse | null {
  if (
    !isPlainObject(payload) ||
    typeof payload.accessToken !== "string" ||
    (typeof payload.refreshToken !== "string" && typeof payload.refreshToken !== "undefined") ||
    typeof payload.expiresAt !== "string" ||
    !isBackendSessionUser(payload.user)
  ) {
    return null;
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAt: payload.expiresAt,
    user: payload.user,
  };
}

export function extractAuthMeResponse(payload: unknown): AuthMeResponse | null {
  if (!isPlainObject(payload) || !isBackendSessionUser(payload.user)) return null;
  return {
    user: payload.user,
  };
}

export function extractAuthLogoutResponse(payload: unknown): AuthLogoutResponse | null {
  if (!isPlainObject(payload) || payload.success !== true) return null;
  return {
    success: true,
  };
}

export function shouldFallbackToLocalAuth(error: unknown) {
  return (
    error instanceof RemoteAuthError &&
    (error.code === "api_not_configured" || error.code === "network_error")
  );
}

export async function signInRemote(email: string, password: string): Promise<AuthSession> {
  ensureAuthApiConfigured();

  const response = await fetchWithTimeout(`${AUTH_API_BASE_URL}${AUTH_LOGIN_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!response.ok) {
    const message = (await parseErrorPayload(response)) ?? `Auth API returned ${response.status}`;
    throw new RemoteAuthError(
      response.status >= 400 && response.status < 500 ? "backend_rejected" : "http_error",
      message,
      response.status
    );
  }

  const parsed = extractAuthLoginResponse((await response.json()) as unknown);
  if (!parsed) {
    throw new RemoteAuthError("invalid_payload", "Auth API returned an invalid login payload.");
  }

  return createRemoteAuthSession(mapBackendSessionUserToAuthUser(parsed.user, { password }), {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
    expiresAt: parsed.expiresAt,
  });
}

export async function refreshRemoteSession(session: AuthSession): Promise<AuthSession> {
  ensureAuthApiConfigured();

  if (session.provider !== "remote" || !session.accessToken) {
    throw new RemoteAuthError("invalid_payload", "Remote session is missing the access token.");
  }

  const response = await fetchWithTimeout(`${AUTH_API_BASE_URL}${AUTH_ME_PATH}`, {
    headers: {
      Accept: "application/json",
      ...buildAuthSessionHeaders(session),
    },
  });

  if (!response.ok) {
    const message = (await parseErrorPayload(response)) ?? `Auth API returned ${response.status}`;
    throw new RemoteAuthError(
      response.status === 401 || response.status === 403 ? "expired_session" : "http_error",
      message,
      response.status
    );
  }

  const parsed = extractAuthMeResponse((await response.json()) as unknown);
  if (!parsed) {
    throw new RemoteAuthError("invalid_payload", "Auth API returned an invalid me payload.");
  }

  return createRemoteAuthSession(
    mapBackendSessionUserToAuthUser(parsed.user, { password: session.user.password }),
    {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt ?? new Date().toISOString(),
    }
  );
}

export async function signOutRemote(session: AuthSession) {
  if (!AUTH_API_BASE_URL || session.provider !== "remote" || !session.accessToken) {
    return;
  }

  const response = await fetchWithTimeout(`${AUTH_API_BASE_URL}${AUTH_LOGOUT_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...buildAuthSessionHeaders(session),
    },
  });

  if (!response.ok) {
    return;
  }

  try {
    extractAuthLogoutResponse((await response.json()) as unknown);
  } catch {
    // Logout is best effort and should not block local cleanup.
  }
}
