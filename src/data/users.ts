export type UserRole = "buyer" | "seller";

export type UserProfile = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
  headline: string;
  phone: string;
  address: string;
  favoriteBeerIds: string[];
  favoriteStoreIds: string[];
  notificationsEnabled: boolean;
  sellerStoreId?: string;
};

export const demoUsers: UserProfile[] = [
  {
    id: "user-pedro",
    email: "pedro@choppnow.app",
    password: "pedro123",
    name: "Pedro",
    role: "buyer",
    avatarInitials: "PE",
    headline: "Comprador tester do app",
    phone: "(61) 99999-1000",
    address: "SQS 308, Asa Sul - Brasilia, DF",
    favoriteBeerIds: ["apoena-ipa", "g17-hazy-ipa", "qp-sour"],
    favoriteStoreIds: ["1", "4"],
    notificationsEnabled: true,
  },
  {
    id: "user-apoena",
    email: "apoena@choppnow.app",
    password: "apoena123",
    name: "Apoena Cervejaria",
    role: "seller",
    avatarInitials: "AC",
    headline: "Conta vendedora da Apoena",
    phone: "(61) 98888-2000",
    address: "CLS 112, Bloco B, Asa Sul - Brasilia, DF",
    favoriteBeerIds: ["apoena-pilsen", "apoena-stout"],
    favoriteStoreIds: ["1", "2"],
    notificationsEnabled: true,
    sellerStoreId: "1",
  },
];

export function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return demoUsers.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
  );
}

export function getUserById(id: string) {
  return demoUsers.find((user) => user.id === id);
}
