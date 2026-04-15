import type { BackendEntityId, IsoDateTimeString } from "./common";

export const SELLER_STORE_AVAILABILITY_PATH = "/v1/seller/store-availability";

export type StoreAvailabilityStatus = "accepting_orders" | "paused";

export type UpdateStoreAvailabilityRequest = {
  storeId: BackendEntityId;
  status: StoreAvailabilityStatus;
};

export type UpdateStoreAvailabilityResponse = {
  storeId: BackendEntityId;
  status: StoreAvailabilityStatus;
  updatedAt: IsoDateTimeString;
};

export function mapAvailabilityFlagToStatus(isAcceptingOrders: boolean): StoreAvailabilityStatus {
  return isAcceptingOrders ? "accepting_orders" : "paused";
}

export function mapAvailabilityStatusToFlag(status: StoreAvailabilityStatus) {
  return status === "accepting_orders";
}
