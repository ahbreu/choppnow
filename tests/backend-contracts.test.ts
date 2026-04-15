import test from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG_DISCOVERY_SCHEMA_VERSION,
  CATALOG_DISCOVERY_VERSION_HEADER,
  CATALOG_INVENTORY_SYNC_PATH,
  CATALOG_SNAPSHOT_PATH,
} from "../src/services/contracts/catalog";
import {
  backendContractEndpoints,
  getBackendEndpointById,
  getMvpRequiredEndpoints,
} from "../src/services/contracts/endpoints";
import {
  mapAvailabilityFlagToStatus,
  mapAvailabilityStatusToFlag,
} from "../src/services/contracts/seller";

test("backend contract manifest keeps unique ids and method/path pairs", () => {
  const endpointIds = new Set<string>();
  const endpointKeys = new Set<string>();

  backendContractEndpoints.forEach((endpoint) => {
    assert.equal(endpointIds.has(endpoint.id), false);
    assert.equal(endpointKeys.has(`${endpoint.method} ${endpoint.path}`), false);
    endpointIds.add(endpoint.id);
    endpointKeys.add(`${endpoint.method} ${endpoint.path}`);
  });

  assert.equal(backendContractEndpoints.length >= 10, true);
});

test("mvp backend contract manifest covers all required areas", () => {
  const areas = new Set(getMvpRequiredEndpoints().map((endpoint) => endpoint.area));

  assert.deepEqual([...areas].sort(), ["auth", "catalog", "orders", "seller"]);
  assert.ok(getBackendEndpointById("catalog.snapshot"));
  assert.ok(getBackendEndpointById("orders.create"));
  assert.ok(getBackendEndpointById("seller.store-availability"));
});

test("catalog contract constants stay aligned with runtime expectations", () => {
  assert.equal(CATALOG_SNAPSHOT_PATH, "/v1/catalog/snapshot");
  assert.equal(CATALOG_INVENTORY_SYNC_PATH, "/v1/catalog/inventory/sync");
  assert.equal(CATALOG_DISCOVERY_SCHEMA_VERSION, 1);
  assert.equal(CATALOG_DISCOVERY_VERSION_HEADER, "x-choppnow-discovery-schema-version");
});

test("seller availability mapping is explicit and reversible", () => {
  assert.equal(mapAvailabilityFlagToStatus(true), "accepting_orders");
  assert.equal(mapAvailabilityFlagToStatus(false), "paused");
  assert.equal(mapAvailabilityStatusToFlag("accepting_orders"), true);
  assert.equal(mapAvailabilityStatusToFlag("paused"), false);
});
