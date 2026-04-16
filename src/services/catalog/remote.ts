import type {
  CatalogBeerContract,
  CreateSellerProductRequest,
  InventorySyncResponse,
  InventorySyncUpdateRequest,
} from "../contracts/catalog";

export type SellerProductDraftInput = {
  name: string;
  style: string;
  abv: string;
  price: string;
  description: string;
  ibu: number;
  initialUnits: number;
};

type SnapshotBeerInventoryLike = {
  availableUnits: number;
  isAvailable: boolean;
  lastSyncedAt: string;
};

type SnapshotBeerLike = {
  id: string;
  inventory: SnapshotBeerInventoryLike;
};

type SnapshotLike<TBeer extends { id: string }> = {
  fetchedAt: string;
  beers: TBeer[];
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function normalizeNonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function isCatalogBeerContract(value: unknown): value is CatalogBeerContract {
  if (!isObjectRecord(value)) return false;
  if (!isObjectRecord(value.inventory)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.storeId === "string" &&
    typeof value.name === "string" &&
    typeof value.style === "string" &&
    typeof value.abv === "string" &&
    typeof value.price === "string" &&
    typeof value.rating === "number" &&
    typeof value.description === "string" &&
    typeof value.ibu === "number" &&
    typeof value.inventory.availableUnits === "number" &&
    typeof value.inventory.isAvailable === "boolean" &&
    typeof value.inventory.lastSyncedAt === "string"
  );
}

export function buildCreateSellerProductRequest(
  storeId: string,
  draft: SellerProductDraftInput
): CreateSellerProductRequest {
  return {
    storeId,
    name: draft.name.trim(),
    style: draft.style.trim(),
    abv: draft.abv.trim(),
    price: draft.price.trim(),
    description: draft.description.trim(),
    ibu: normalizeNonNegativeInteger(draft.ibu),
    initialUnits: normalizeNonNegativeInteger(draft.initialUnits),
  };
}

export function extractCatalogBeerFromMutationResponse(payload: unknown): CatalogBeerContract | null {
  if (!isObjectRecord(payload)) return null;

  const candidate =
    isObjectRecord(payload.product) || Array.isArray(payload.product)
      ? payload.product
      : payload;

  return isCatalogBeerContract(candidate) ? candidate : null;
}

export function extractInventorySyncResponse(payload: unknown): InventorySyncResponse | null {
  if (!isObjectRecord(payload)) return null;

  if (
    typeof payload.acceptedCount !== "number" ||
    typeof payload.rejectedCount !== "number" ||
    typeof payload.syncedAt !== "string"
  ) {
    return null;
  }

  return {
    acceptedCount: normalizeNonNegativeInteger(payload.acceptedCount),
    rejectedCount: normalizeNonNegativeInteger(payload.rejectedCount),
    syncedAt: payload.syncedAt,
  };
}

export function upsertCatalogBeerInSnapshot<
  TBeer extends { id: string },
  TSnapshot extends SnapshotLike<TBeer>,
>(snapshot: TSnapshot, beer: TBeer, fetchedAt = new Date().toISOString()): TSnapshot {
  const existingIndex = snapshot.beers.findIndex((item) => item.id === beer.id);
  const nextBeers = [...snapshot.beers];

  if (existingIndex >= 0) {
    nextBeers[existingIndex] = beer;
  } else {
    nextBeers.push(beer);
  }

  return {
    ...snapshot,
    fetchedAt,
    beers: nextBeers,
  };
}

export function applyInventorySyncUpdatesToSnapshot<
  TBeer extends SnapshotBeerLike,
  TSnapshot extends SnapshotLike<TBeer>,
>(
  snapshot: TSnapshot,
  updates: Array<Pick<InventorySyncUpdateRequest, "beerId" | "availableUnits">>,
  syncedAt: string
): TSnapshot {
  if (updates.length === 0) return snapshot;

  const updatesByBeerId = updates.reduce<Record<string, number>>((acc, item) => {
    acc[item.beerId] = normalizeNonNegativeInteger(item.availableUnits);
    return acc;
  }, {});

  let touched = false;
  const nextBeers = snapshot.beers.map((beer) => {
    if (!Object.prototype.hasOwnProperty.call(updatesByBeerId, beer.id)) {
      return beer;
    }

    touched = true;
    const availableUnits = updatesByBeerId[beer.id]!;
    return {
      ...beer,
      inventory: {
        ...beer.inventory,
        availableUnits,
        isAvailable: availableUnits > 0,
        lastSyncedAt: syncedAt,
      },
    };
  });

  if (!touched) return snapshot;

  return {
    ...snapshot,
    fetchedAt: syncedAt,
    beers: nextBeers,
  };
}
