import test from "node:test";
import assert from "node:assert/strict";
import { CartState } from "../src/data/commerce";
import { initialOrders } from "../src/data/orders";
import { demoUsers } from "../src/data/users";
import { OrdersGatewayError } from "../src/services/orders/gateway";
import {
  buildLocalOrderRecord,
  createOperationalNotifications,
  localOrdersGateway,
} from "../src/services/orders/local";

const buyer = demoUsers.find((user) => user.id === "user-pedro");
const seller = demoUsers.find((user) => user.id === "user-apoena");

function buildCart(): CartState {
  return {
    storeId: "1",
    storeName: "Apoena Cervejaria",
    items: [
      {
        id: "apoena-ipa::base",
        beerId: "apoena-ipa",
        beerName: "Apoena IPA",
        beerStyle: "India Pale Ale",
        storeId: "1",
        storeName: "Apoena Cervejaria",
        unitPrice: 18.9,
        quantity: 2,
        addOns: [],
      },
    ],
  };
}

test("local order record computes a buyer order with totals and SLA", () => {
  assert.ok(buyer);

  const order = buildLocalOrderRecord({
    buyer: buyer!,
    cart: buildCart(),
    draft: {
      paymentMethod: "pix",
      deliveryNotes: "",
      couponCode: "",
    },
    storeId: "1",
  });

  assert.equal(order.buyerId, "user-pedro");
  assert.equal(order.storeId, "1");
  assert.equal(order.status, "placed");
  assert.equal(order.slaMinutes, 35);
  assert.equal(order.items.length, 1);
});

test("operational notifications are created for buyer and seller", () => {
  assert.ok(buyer);

  const order = buildLocalOrderRecord({
    buyer: buyer!,
    cart: buildCart(),
    draft: {
      paymentMethod: "card",
      deliveryNotes: "",
      couponCode: "",
    },
    storeId: "1",
  });

  const notifications = createOperationalNotifications(order, "placed");
  const audienceIds = notifications.map((notification) => notification.audienceUserId).sort();

  assert.equal(notifications.length, 2);
  assert.deepEqual(audienceIds, ["user-apoena", "user-pedro"]);
});

test("local orders gateway advances seller order status", () => {
  assert.ok(seller);

  const result = localOrdersGateway.advanceOrder({
    currentUser: seller!,
    orders: initialOrders,
    orderId: "order-1001",
  });

  assert.equal(result.updatedOrder.status, "ready_for_dispatch");
  assert.equal(result.notifications.length, 2);
});

test("local orders gateway blocks invalid seller transitions", () => {
  assert.ok(seller);

  assert.throws(
    () =>
      localOrdersGateway.advanceOrder({
        currentUser: seller!,
        orders: initialOrders,
        orderId: "order-1001",
        targetStatus: "delivered",
      }),
    (error: unknown) =>
      error instanceof OrdersGatewayError && error.code === "invalid_transition"
  );
});
