import { UserProfile } from "../../data/users";

export type AuthProvider = "demo" | "google" | "remote";
export type AuthSessionUser = UserProfile;
export type AuthSession = {
  provider: AuthProvider;
  user: AuthSessionUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
};
export type GoogleIdentity = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export interface AuthGateway {
  signInWithEmail(email: string, password: string): AuthSessionUser | null;
  getUserById(id: string): AuthSessionUser | null;
  getSellerUserByStoreId(storeId: string): AuthSessionUser | null;
  listDemoAccounts(): AuthSessionUser[];
}
