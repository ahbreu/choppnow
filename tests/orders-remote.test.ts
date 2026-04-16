import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCreateOrderRequest,
  extractCreateOrderResponse,
  extractOrderListResponse,
  extractUpdateOrderStatusResponse,
  mapOrderContractToRecord,
  mergeRemoteOrdersIntoRuntime,
  shouldFallbackToLocalOrders,
  RemoteOrdersGatewayError,
} from "../src/services/orders/remote";
import { demoUsers } from "../src/data/users";

const buyer = demoUsers.find((user) => user.id === "user-pedro");

test("buildCreateOrderRequest maps cart items, add-ons and delivery context", () => {
  assert.ok(buyer);

  const request = buildCreateOrderRequest({
    buyer: buyer!,
    cart: {
      storeId: "1",
      storeName: "Apoena Cervejaria",
      items: [
        {
          id: "apoena-ipa::1",
          beerId: "apoena-ipa",
          beerName: "Apoena IPA",
          beerStyle: "IPA",
          storeId: "1",
          storeName: "Apoena Cervejaria",
          unitPrice: 18.9,
          quantity: 2,
          addOns: [{ id: "cold-kit", label: "Kit gelo extra", price: 4.9, quantity: 1 }],
        },
      ],
    },
    draft: {
      paymentMethod: "pix",
      deliveryNotes: " Portaria principal ",
      couponCode: " BEMVINDO ",
    },
    storeId: "1",
  });

  assert.deepEqual(request, {
    storeId: "1",
    items: [
      {
        beerId: "apoena-ipa",
        quantity: 2,
        addOns: [{ id: "cold-kit", quantity: 1 }],
      },
    ],
    paymentMethod: "pix",
    deliveryAddress: buyer!.address,
    deliveryNotes: "Portaria principal",
    couponCode: "BEMVINDO",
  });
});

test("mapOrderContractToRecord formats totals and keeps order metadata", () => {
  const record = mapOrderContractToRecord({
    id: "order-3001",
    buyerId: "user-pedro",
    storeId: "1",
    items: [{ beerId: "apoena-ipa", quantity: 2 }],
    totals: {
      currency: "BRL",
      subtotal: 37.8,
      deliveryFee: 7.9,
      serviceFee: 2.5,
      total: 48.2,
    },
    createdAt: "2026-04-15T21:00:00.000Z",
    status: "placed",
    slaMinutes: 35,
    checkoutReference: "REMOTE-123",
    buyerNotificationsEnabled: true,
  });

  assert.equal(record.id, "order-3001");
  assert.equal(record.total, "R$ 48,20");
  assert.equal(record.checkoutReference, "REMOTE-123");
  assert.equal(record.status, "placed");
});

test("remote orders payload extractors validate contract shapes", () => {
  const createResponse = extractCreateOrderResponse({
    order: {
      id: "order-1",
      buyerId: "user-pedro",
      storeId: "1",
      items: [{ beerId: "apoena-ipa", quantity: 1 }],
      totals: {
        currency: "BRL",
        subtotal: 18.9,
        deliveryFee: 7.9,
        serviceFee: 2.5,
        total: 29.3,
      },
      createdAt: "2026-04-15T21:00:00.000Z",
      status: "placed",
      slaMinutes: 35,
      checkoutReference: "REMOTE-1",
      buyerNotificationsEnabled: true,
    },
  });

  const listResponse = extractOrderListResponse({
    items: [createResponse!.order],
    total: 1,
  });
  const updateResponse = extractUpdateOrderStatusResponse({
    order: createResponse!.order,
    changedAt: "2026-04-15T21:05:00.000Z",
  });

  assert.ok(createResponse);
  assert.equal(listResponse?.length, 1);
  assert.equal(updateResponse?.order.id, "order-1");
  assert.equal(extractOrderListResponse({ items: [{}], total: 1 }), null);
});

test("mergeRemoteOrdersIntoRuntime upserts remote orders without dropping local fallback records", () => {
  const merged = mergeRemoteOrdersIntoRuntime(
    [
      {
        id: "local-order",
        buyerId: "user-pedro",
        storeId: "1",
        items: [{ beerId: "apoena-ipa", quantity: 1 }],
        total: "R$ 18,90",
        createdAt: "Hoje, 20:00",
        slaMinutes: 35,
        status: "placed",
        checkoutReference: "LOCAL-1",
      },
      {
        id: "remote-order",
        buyerId: "user-pedro",
        storeId: "1",
        items: [{ beerId: "apoena-ipa", quantity: 1 }],
        total: "R$ 18,90",
        createdAt: "Hoje, 19:00",
        slaMinutes: 35,
        status: "placed",
      },
    ],
    [
      {
        id: "remote-order",
        buyerId: "user-pedro",
        storeId: "1",
        items: [{ beerId: "apoena-ipa", quantity: 1 }],
        total: "R$ 18,90",
        createdAt: "15/04, 21:00",
        slaMinutes: 35,
        status: "confirmed",
      },
    ]
  );

  assert.equal(merged.length, 2);
  assert.equal(merged.find((order) => order.id === "remote-order")?.status, "confirmed");
  assert.ok(merged.find((order) => order.id === "local-order"));
});

test("shouldFallbackToLocalOrders only accepts unavailable or network remote errors", () => {
  assert.equal(
    shouldFallbackToLocalOrders(new RemoteOrdersGatewayError("api_not_configured", "no api")),
    true
  );
  assert.equal(
    shouldFallbackToLocalOrders(new RemoteOrdersGatewayError("network_error", "fetch failed")),
    true
  );
  assert.equal(
    shouldFallbackToLocalOrders(new RemoteOrdersGatewayError("backend_rejected", "bad request")),
    false
  );
});
