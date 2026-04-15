import test from "node:test";
import assert from "node:assert/strict";
import { initialOrders } from "../src/data/orders";
import {
  createInitialOrdersRuntimeState,
  isPersistedOrdersRuntimeState,
  MAX_OPERATIONAL_NOTIFICATIONS,
  mergeSellerAvailability,
  prependOperationalNotifications,
  upsertRuntimeOrder,
} from "../src/services/orders/storage";

test("initial orders runtime state starts with seed orders and seller availability", () => {
  const state = createInitialOrdersRuntimeState({
    "1": true,
    "2": false,
  });

  assert.deepEqual(state.orders, initialOrders);
  assert.deepEqual(state.notifications, []);
  assert.deepEqual(state.sellerAvailability, {
    "1": true,
    "2": false,
  });
});

test("persisted orders runtime validator accepts checkout metadata", () => {
  const validState = {
    orders: [
      {
        ...initialOrders[0],
        checkoutReference: "LOCAL-123",
        buyerNotificationsEnabled: true,
      },
    ],
    notifications: [
      {
        id: "notification-1",
        orderId: initialOrders[0]!.id,
        audienceUserId: initialOrders[0]!.buyerId,
        status: "placed",
        title: "Pedido criado",
        message: "Pedido registrado",
        channel: "push",
        createdAt: "10:30",
      },
    ],
    sellerAvailability: {
      "1": true,
    },
  };

  assert.equal(isPersistedOrdersRuntimeState(validState), true);
});

test("seller availability merge keeps overrides and new stores", () => {
  const merged = mergeSellerAvailability(
    {
      "1": true,
      "2": true,
    },
    {
      "2": false,
      "4": true,
    }
  );

  assert.deepEqual(merged, {
    "1": true,
    "2": false,
    "4": true,
  });
});

test("prepended notifications keep newest items capped", () => {
  const current = Array.from({ length: MAX_OPERATIONAL_NOTIFICATIONS }, (_, index) => ({
    id: `current-${index}`,
    orderId: "order-1001",
    audienceUserId: "user-pedro",
    status: "placed" as const,
    title: `Current ${index}`,
    message: `Current message ${index}`,
    channel: "push" as const,
    createdAt: "10:00",
  }));

  const next = [
    {
      id: "next-1",
      orderId: "order-1002",
      audienceUserId: "user-pedro",
      status: "confirmed" as const,
      title: "Next 1",
      message: "Next message 1",
      channel: "in_app" as const,
      createdAt: "10:05",
    },
  ];

  const combined = prependOperationalNotifications(current, next);

  assert.equal(combined.length, MAX_OPERATIONAL_NOTIFICATIONS);
  assert.equal(combined[0]?.id, "next-1");
});

test("upsert runtime order replaces existing order and prepends new ones", () => {
  const updatedExistingOrder = {
    ...initialOrders[0]!,
    status: "confirmed" as const,
  };
  const existingResult = upsertRuntimeOrder(initialOrders, updatedExistingOrder);

  assert.equal(existingResult[0]?.status, "confirmed");

  const newOrder = {
    ...initialOrders[0]!,
    id: "order-2000",
  };
  const insertedResult = upsertRuntimeOrder(initialOrders, newOrder);

  assert.equal(insertedResult[0]?.id, "order-2000");
});
