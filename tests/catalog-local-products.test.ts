import test from "node:test";
import assert from "node:assert/strict";
import type { CatalogSnapshot } from "../src/services/catalog/repository";
import {
  buildCatalogBeerId,
  buildCatalogRuntimeBeerRecords,
  createLocalCatalogBeerRecord,
  mergeCatalogSnapshotWithLocalProducts,
} from "../src/services/catalog/local-products";

function buildSnapshot(): CatalogSnapshot {
  return {
    version: 1,
    fetchedAt: "2026-04-15T12:00:00.000Z",
    stores: [
      {
        id: "1",
        name: "Apoena Cervejaria",
        tag: "R$ 5 off",
        short: "AC",
        description: "Loja base para testes do catalogo.",
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
        description: "IPA base para testes.",
        ibu: 62,
        inventory: {
          availableUnits: 12,
          isAvailable: true,
          lastSyncedAt: "2026-04-15T11:00:00.000Z",
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

test("buildCatalogBeerId creates a stable seller namespace with collision handling", () => {
  const id = buildCatalogBeerId("Apoena Cervejaria", "West Coast IPA", [
    "seller-apoena-cervejaria-west-coast-ipa",
  ]);

  assert.equal(id, "seller-apoena-cervejaria-west-coast-ipa-2");
});

test("createLocalCatalogBeerRecord normalizes stock and bitterness inputs", () => {
  const record = createLocalCatalogBeerRecord(
    "1",
    {
      name: "  Nova Sour  ",
      style: "Catharina Sour",
      abv: "4.9%",
      price: "R$ 19,90",
      description: "  Manga e maracuja. ",
      ibu: Number.NaN,
      initialUnits: Number.NaN,
    },
    []
  );

  assert.equal(record.id, "seller-1-nova-sour");
  assert.equal(record.name, "Nova Sour");
  assert.equal(record.description, "Manga e maracuja.");
  assert.equal(record.ibu, 0);
  assert.equal(record.inventory.availableUnits, 0);
  assert.equal(record.inventory.isAvailable, false);
});

test("mergeCatalogSnapshotWithLocalProducts appends new beers and overrides matching ids", () => {
  const snapshot = buildSnapshot();
  const overrideRecord = {
    ...snapshot.beers[0]!,
    price: "R$ 21,90",
  };
  const localRecord = createLocalCatalogBeerRecord(
    "1",
    {
      name: "Apoena Fresh Hop",
      style: "Fresh Hop IPA",
      abv: "6.8%",
      price: "R$ 24,90",
      description: "Lote sazonal.",
      ibu: 55,
      initialUnits: 18,
    },
    snapshot.beers.map((beer) => beer.id)
  );

  const merged = mergeCatalogSnapshotWithLocalProducts(snapshot, [overrideRecord, localRecord]);

  assert.equal(merged.beers.length, 2);
  assert.equal(merged.beers[0]?.price, "R$ 21,90");
  assert.equal(merged.beers[1]?.id, localRecord.id);
});

test("buildCatalogRuntimeBeerRecords restores availability from overrides and marks local products", () => {
  const soldOutSnapshot: CatalogSnapshot = {
    ...buildSnapshot(),
    beers: [
      {
        ...buildSnapshot().beers[0]!,
        inventory: {
          availableUnits: 0,
          isAvailable: false,
          lastSyncedAt: "2026-04-15T08:00:00.000Z",
        },
      },
    ],
  };

  const records = buildCatalogRuntimeBeerRecords(
    soldOutSnapshot,
    {
      "apoena-ipa": 9,
    },
    new Set(["apoena-ipa"])
  );

  assert.equal(records.length, 1);
  assert.equal(records[0]?.currentAvailableUnits, 9);
  assert.equal(records[0]?.currentIsAvailable, true);
  assert.equal(records[0]?.isLocalOnly, true);
});
