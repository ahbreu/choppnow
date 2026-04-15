import type { CatalogBeerRecord, CatalogSnapshot } from "./repository";

export type CatalogBeerRuntimeRecord = CatalogBeerRecord & {
  currentAvailableUnits: number;
  currentIsAvailable: boolean;
  isLocalOnly: boolean;
};

export type CatalogLocalProductDraft = {
  name: string;
  style: string;
  abv: string;
  price: string;
  description: string;
  ibu: number;
  initialUnits: number;
};

function normalizeCatalogIdFragment(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "rotulo";
}

function normalizeNonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function buildCatalogBeerId(storeId: string, name: string, existingBeerIds: string[]) {
  const safeStoreId = normalizeCatalogIdFragment(storeId);
  const safeName = normalizeCatalogIdFragment(name);
  const existingIds = new Set(existingBeerIds);

  let candidate = `seller-${safeStoreId}-${safeName}`;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `seller-${safeStoreId}-${safeName}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function createLocalCatalogBeerRecord(
  storeId: string,
  draft: CatalogLocalProductDraft,
  existingBeerIds: string[]
): CatalogBeerRecord {
  const nowIso = new Date().toISOString();
  const initialUnits = normalizeNonNegativeInteger(draft.initialUnits);

  return {
    id: buildCatalogBeerId(storeId, draft.name, existingBeerIds),
    storeId,
    name: draft.name.trim(),
    style: draft.style.trim(),
    abv: draft.abv.trim(),
    price: draft.price.trim(),
    rating: 4.5,
    description: draft.description.trim(),
    ibu: normalizeNonNegativeInteger(draft.ibu),
    inventory: {
      availableUnits: initialUnits,
      isAvailable: initialUnits > 0,
      lastSyncedAt: nowIso,
    },
  };
}

export function mergeCatalogSnapshotWithLocalProducts(
  snapshot: CatalogSnapshot,
  localProducts: CatalogBeerRecord[]
): CatalogSnapshot {
  if (localProducts.length === 0) return snapshot;

  const localProductsById = localProducts.reduce<Record<string, CatalogBeerRecord>>((acc, beer) => {
    acc[beer.id] = beer;
    return acc;
  }, {});
  const snapshotBeerIds = new Set(snapshot.beers.map((beer) => beer.id));

  const mergedSnapshotBeers = snapshot.beers.map((beer) => localProductsById[beer.id] ?? beer);
  const appendedLocalBeers = localProducts.filter((beer) => !snapshotBeerIds.has(beer.id));

  return {
    ...snapshot,
    beers: [...mergedSnapshotBeers, ...appendedLocalBeers],
  };
}

export function buildCatalogRuntimeBeerRecords(
  snapshot: CatalogSnapshot,
  inventoryOverrides: Record<string, number>,
  localOnlyBeerIds: Set<string> = new Set()
): CatalogBeerRuntimeRecord[] {
  return snapshot.beers.map((beer) => {
    const overriddenUnits = inventoryOverrides[beer.id];
    const currentAvailableUnits =
      typeof overriddenUnits === "number"
        ? Math.max(0, Math.round(overriddenUnits))
        : beer.inventory.availableUnits;

    return {
      ...beer,
      currentAvailableUnits,
      currentIsAvailable: currentAvailableUnits > 0,
      isLocalOnly: localOnlyBeerIds.has(beer.id),
    };
  });
}
