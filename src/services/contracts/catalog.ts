import type {
  CatalogFilterPreset,
  DiscoveryCampaign,
  DiscoveryHighlight,
  DiscoveryStoryStep,
} from "../../data/discovery";
import type { BackendEntityId, IsoDateTimeString } from "./common";
import type { StoreAvailabilityStatus } from "./seller";

export const CATALOG_SNAPSHOT_PATH = "/v1/catalog/snapshot";
export const CATALOG_INVENTORY_SYNC_PATH = "/v1/catalog/inventory/sync";
export const SELLER_PRODUCTS_PATH = "/v1/seller/products";
export const SELLER_PRODUCT_BY_ID_PATH = "/v1/seller/products/:id";
export const CATALOG_DISCOVERY_SCHEMA_VERSION = 1;
export const CATALOG_DISCOVERY_VERSION_HEADER = "x-choppnow-discovery-schema-version";

export type CatalogInventoryContract = {
  availableUnits: number;
  isAvailable: boolean;
  lastSyncedAt: IsoDateTimeString;
};

export type CatalogStoreContract = {
  id: BackendEntityId;
  name: string;
  tag: string;
  short: string;
  description: string;
  address: string;
  rating: number;
  availabilityStatus?: StoreAvailabilityStatus;
};

export type CatalogBeerContract = {
  id: BackendEntityId;
  storeId: BackendEntityId;
  name: string;
  style: string;
  abv: string;
  price: string;
  rating: number;
  description: string;
  ibu: number;
  inventory: CatalogInventoryContract;
};

export type CatalogSnapshotResponse = {
  version: number;
  fetchedAt: IsoDateTimeString;
  stores: CatalogStoreContract[];
  beers: CatalogBeerContract[];
  discovery: {
    version: number;
    highlights: DiscoveryHighlight[];
    campaigns: DiscoveryCampaign[];
    storySteps: DiscoveryStoryStep[];
    filters: CatalogFilterPreset[];
  };
};

export type CreateSellerProductRequest = {
  storeId: BackendEntityId;
  name: string;
  style: string;
  abv: string;
  price: string;
  description: string;
  ibu: number;
  initialUnits: number;
};

export type UpdateSellerProductRequest = Partial<
  Omit<CreateSellerProductRequest, "storeId" | "initialUnits">
>;

export type SellerProductMutationResponse = {
  product: CatalogBeerContract;
};

export type InventorySyncReason =
  | "checkout-order-placed"
  | "seller-restock"
  | "seller-stock-adjustment";

export type InventorySyncUpdateRequest = {
  eventId?: string;
  beerId: BackendEntityId;
  availableUnits: number;
  reason: InventorySyncReason;
  queuedAt?: IsoDateTimeString;
};

export type InventorySyncRequest = {
  syncedAt: IsoDateTimeString;
  updates: InventorySyncUpdateRequest[];
};

export type InventorySyncResponse = {
  acceptedCount: number;
  rejectedCount: number;
  syncedAt: IsoDateTimeString;
};
