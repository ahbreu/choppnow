import { UserProfile } from "../../data/users";

export type AuthProvider = "demo" | "google";
export type AuthSessionUser = UserProfile;
export type AuthSession = {
  provider: AuthProvider;
  user: AuthSessionUser;
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
