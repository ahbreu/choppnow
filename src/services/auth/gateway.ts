import { UserProfile } from "../../data/users";

export type AuthSessionUser = UserProfile;

export interface AuthGateway {
  signInWithEmail(email: string, password: string): AuthSessionUser | null;
  getUserById(id: string): AuthSessionUser | null;
  getSellerUserByStoreId(storeId: string): AuthSessionUser | null;
  listDemoAccounts(): AuthSessionUser[];
}
