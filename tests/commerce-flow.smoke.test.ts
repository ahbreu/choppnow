import test from "node:test";
import assert from "node:assert/strict";
import { CartState } from "../src/data/commerce";
import { OrderItemRecord, OrderStatusCode } from "../src/data/orders";
import { getAllBeers, initialStores } from "../src/data/stores";
import { demoAuthGateway } from "../src/services/auth/demo";
import { localOrdersGateway } from "../src/services/orders/local";
import {
  createInitialOrdersRuntimeState,
  prependOperationalNotifications,
  upsertRuntimeOrder,
} from "../src/services/orders/storage";

function buildCart(): CartState {
  const beer = getAllBeers(initialStores).find((item) => item.id === "apoena-ipa");

  assert.ok(beer);

  return {
    storeId: beer.storeId,
    storeName: beer.storeName,
    items: [
      {
        id: `${beer.id}::base`,
        beerId: beer.id,
        beerName: beer.name,
        beerStyle: beer.style,
        storeId: beer.storeId,
        storeName: beer.storeName,
        unitPrice: 18.9,
        quantity: 2,
        addOns: [],
      },
    ],
  };
}

test("critical commerce smoke keeps buyer checkout and seller fulfillment coherent", async () => {
  const buyer = demoAuthGateway.signInWithEmail("PEDRO@CHOPPNOW.APP", "pedro123");
  const seller = demoAuthGateway.getSellerUserByStoreId("1");

  assert.ok(buyer);
  assert.ok(seller);

  let runtimeState = createInitialOrdersRuntimeState({
    "1": true,
  });

  const placedResult = await localOrdersGateway.placeOrder({
    buyer,
    cart: buildCart(),
    draft: {
      paymentMethod: "pix",
      deliveryNotes: "Portaria principal",
      couponCode: "",
    },
    storeId: "1",
  });

  runtimeState = {
    ...runtimeState,
    orders: upsertRuntimeOrder(runtimeState.orders, placedResult.order),
    notifications: prependOperationalNotifications(runtimeState.notifications, placedResult.notifications),
  };

  let currentOrder: OrderItemRecord | undefined = runtimeState.orders[0];
  assert.ok(currentOrder);
  assert.match(placedResult.checkoutReference, /^LOCAL-/);
  assert.equal(currentOrder?.status, "placed");

  const visitedStatuses: OrderStatusCode[] = [currentOrder.status];

  while (currentOrder && currentOrder.status !== "delivered") {
    const update = await localOrdersGateway.advanceOrder({
      currentUser: seller,
      orders: runtimeState.orders,
      orderId: currentOrder.id,
    });

    runtimeState = {
      ...runtimeState,
      orders: upsertRuntimeOrder(runtimeState.orders, update.updatedOrder),
      notifications: prependOperationalNotifications(runtimeState.notifications, update.notifications),
    };

    currentOrder = runtimeState.orders.find((order) => order.id === placedResult.order.id);
    assert.ok(currentOrder);
    visitedStatuses.push(currentOrder.status);
  }

  assert.deepEqual(visitedStatuses, [
    "placed",
    "confirmed",
    "preparing",
    "ready_for_dispatch",
    "out_for_delivery",
    "delivered",
  ]);
  assert.equal(runtimeState.orders[0]?.checkoutReference, placedResult.checkoutReference);
  assert.equal(runtimeState.notifications[0]?.status, "delivered");
  assert.equal(runtimeState.notifications.length >= 10, true);
});
