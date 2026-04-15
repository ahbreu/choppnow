import { authenticateUser, demoUsers, getUserById } from "../../data/users";
import { AuthGateway } from "./gateway";

export const demoAuthGateway: AuthGateway = {
  signInWithEmail(email, password) {
    return authenticateUser(email, password) ?? null;
  },
  getUserById(id) {
    return getUserById(id) ?? null;
  },
  getSellerUserByStoreId(storeId) {
    return demoUsers.find((user) => user.role === "seller" && user.sellerStoreId === storeId) ?? null;
  },
  listDemoAccounts() {
    return [...demoUsers];
  },
};
