import test from "node:test";
import assert from "node:assert/strict";
import type { CatalogSnapshotResponse } from "../src/services/contracts/catalog";
import {
  applyInventorySyncUpdatesToSnapshot,
  buildCreateSellerProductRequest,
  extractCatalogBeerFromMutationResponse,
  extractInventorySyncResponse,
  upsertCatalogBeerInSnapshot,
} from "../src/services/catalog/remote";

function buildSnapshot(): CatalogSnapshotResponse {
  return {
    version: 2,
    fetchedAt: "2026-04-15T18:00:00.000Z",
    stores: [
      {
        id: "1",
        name: "Apoena Cervejaria",
        tag: "Lotes frescos",
        short: "AC",
        description: "Loja base para os testes remotos.",
        address: "CLS 112, Asa Sul - Brasilia, DF",
        rating: 4.8,
      },
    ],
    beers: [
      {
        id: "apoena-ipa",
        storeId: "1",
        name: "Apoena IPA",
        style: "India Pale Ale",
        abv: "6.2%",
        price: "R$ 18,90",
        rating: 4.8,
        description: "IPA base do snapshot remoto.",
        ibu: 62,
        inventory: {
          availableUnits: 12,
          isAvailable: true,
          lastSyncedAt: "2026-04-15T17:00:00.000Z",
        },
      },
    ],
    discovery: {
      version: 1,
      highlights: [],
      campaigns: [],
      storySteps: [],
      filters: [],
    },
  };
}

test("buildCreateSellerProductRequest trims text and normalizes numeric fields", () => {
  const request = buildCreateSellerProductRequest("1", {
    name: "  Nova Juicy IPA ",
    style: "  New England IPA ",
    abv: " 6.8% ",
    price: " R$ 24,90 ",
    description: "  Lote aromatico. ",
    ibu: 47.8,
    initialUnits: Number.NaN,
  });

  assert.deepEqual(request, {
    storeId: "1",
    name: "Nova Juicy IPA",
    style: "New England IPA",
    abv: "6.8%",
    price: "R$ 24,90",
    description: "Lote aromatico.",
    ibu: 48,
    initialUnits: 0,
  });
});

test("extractCatalogBeerFromMutationResponse accepts the contract payload and rejects malformed bodies", () => {
  const product = extractCatalogBeerFromMutationResponse({
    product: {
      id: "remote-1",
      storeId: "1",
      name: "Remote Lager",
      style: "Lager",
      abv: "5.0%",
      price: "R$ 15,90",
      rating: 4.3,
      description: "Payload remoto valido.",
      ibu: 18,
      inventory: {
        availableUnits: 20,
        isAvailable: true,
        lastSyncedAt: "2026-04-15T18:10:00.000Z",
      },
    },
  });

  assert.equal(product?.id, "remote-1");
  assert.equal(extractCatalogBeerFromMutationResponse({ product: { id: "broken" } }), null);
});

test("upsertCatalogBeerInSnapshot replaces existing beers and appends new ones", () => {
  const snapshot = buildSnapshot();
  const replaced = upsertCatalogBeerInSnapshot(
    snapshot,
    {
      ...snapshot.beers[0]!,
      price: "R$ 19,90",
    },
    "2026-04-15T18:30:00.000Z"
  );
  const appended = upsertCatalogBeerInSnapshot(
    replaced,
    {
      ...snapshot.beers[0]!,
      id: "remote-2",
      name: "Remote Pilsner",
    },
    "2026-04-15T18:40:00.000Z"
  );

  assert.equal(replaced.beers[0]?.price, "R$ 19,90");
  assert.equal(appended.beers.length, 2);
  assert.equal(appended.beers[1]?.id, "remote-2");
  assert.equal(appended.fetchedAt, "2026-04-15T18:40:00.000Z");
});

test("applyInventorySyncUpdatesToSnapshot patches stock and availability for synced beers", () => {
  const snapshot = buildSnapshot();
  const updated = applyInventorySyncUpdatesToSnapshot(
    snapshot,
    [
      {
        beerId: "apoena-ipa",
        availableUnits: 0,
      },
    ],
    "2026-04-15T18:45:00.000Z"
  );

  assert.equal(updated.beers[0]?.inventory.availableUnits, 0);
  assert.equal(updated.beers[0]?.inventory.isAvailable, false);
  assert.equal(updated.beers[0]?.inventory.lastSyncedAt, "2026-04-15T18:45:00.000Z");
  assert.equal(updated.fetchedAt, "2026-04-15T18:45:00.000Z");
});

test("extractInventorySyncResponse validates the backend sync counters", () => {
  const response = extractInventorySyncResponse({
    acceptedCount: 3,
    rejectedCount: 0,
    syncedAt: "2026-04-15T18:50:00.000Z",
  });

  assert.deepEqual(response, {
    acceptedCount: 3,
    rejectedCount: 0,
    syncedAt: "2026-04-15T18:50:00.000Z",
  });
  assert.equal(extractInventorySyncResponse({ acceptedCount: 1 }), null);
});
