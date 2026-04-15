import { AuthProvider, AuthSession, AuthSessionUser, GoogleIdentity } from "./gateway";

export const AUTH_SESSION_STORAGE_KEY = "choppnow-auth-session";

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isAuthProvider(value: unknown): value is AuthProvider {
  return value === "demo" || value === "google";
}

function isAuthSessionUser(value: unknown): value is AuthSessionUser {
  if (!value || typeof value !== "object") return false;

  const user = value as AuthSessionUser;
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.password === "string" &&
    typeof user.name === "string" &&
    (user.role === "buyer" || user.role === "seller") &&
    typeof user.avatarInitials === "string" &&
    typeof user.headline === "string" &&
    typeof user.phone === "string" &&
    typeof user.address === "string" &&
    hasStringArray(user.favoriteBeerIds) &&
    hasStringArray(user.favoriteStoreIds) &&
    typeof user.notificationsEnabled === "boolean" &&
    (typeof user.sellerStoreId === "string" || typeof user.sellerStoreId === "undefined")
  );
}

function buildAvatarInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "GO";
}

export function createAuthSession(provider: AuthProvider, user: AuthSessionUser): AuthSession {
  return { provider, user };
}

export function isPersistedAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;

  const session = value as AuthSession;
  return isAuthProvider(session.provider) && isAuthSessionUser(session.user);
}

export function createGoogleBuyerProfile(identity: GoogleIdentity): AuthSessionUser {
  return {
    id: `google:${identity.id}`,
    email: identity.email.trim().toLowerCase(),
    password: "",
    name: identity.name.trim() || identity.email.trim(),
    role: "buyer",
    avatarInitials: buildAvatarInitials(identity.name || identity.email),
    headline: "Conta conectada via Google",
    phone: "Nao informado",
    address: "Endereco pendente de cadastro",
    favoriteBeerIds: [],
    favoriteStoreIds: [],
    notificationsEnabled: true,
  };
}

async function loadStorageModule() {
  return import("../../utils/storage");
}

export async function loadPersistedAuthSession() {
  const { getItem } = await loadStorageModule();
  const stored = await getItem<unknown>(AUTH_SESSION_STORAGE_KEY);
  return isPersistedAuthSession(stored) ? stored : null;
}

export async function persistAuthSession(session: AuthSession) {
  const { saveItem } = await loadStorageModule();
  await saveItem(AUTH_SESSION_STORAGE_KEY, session);
}

export async function clearPersistedAuthSession() {
  const { removeItem } = await loadStorageModule();
  await removeItem(AUTH_SESSION_STORAGE_KEY);
}
