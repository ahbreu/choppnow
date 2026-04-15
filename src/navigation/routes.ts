import { CatalogMode } from "../pages/catalog";

export type Route =
  | { name: "login" }
  | { name: "landing" }
  | { name: "search" }
  | { name: "orders" }
  | { name: "profile" }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "catalog"; mode: CatalogMode }
  | { name: "store-details"; storeId: string }
  | { name: "beer-details"; beerId: string };
