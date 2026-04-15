import type { UserRole } from "../../data/users";
import type { BackendEntityId, IsoDateTimeString } from "./common";

export const AUTH_LOGIN_PATH = "/v1/auth/login";
export const AUTH_LOGOUT_PATH = "/v1/auth/logout";
export const AUTH_ME_PATH = "/v1/auth/me";

export type BackendSessionUser = {
  id: BackendEntityId;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  address: string;
  notificationsEnabled: boolean;
  sellerStoreId?: BackendEntityId;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: IsoDateTimeString;
  user: BackendSessionUser;
};

export type AuthLogoutResponse = {
  success: true;
};

export type AuthMeResponse = {
  user: BackendSessionUser;
};
