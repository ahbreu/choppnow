import test from "node:test";
import assert from "node:assert/strict";
import { createReadinessReport, getReadinessSummary } from "../src/services/qa/readiness";

test("seed readiness smoke passes for the shipped dataset", () => {
  const report = createReadinessReport();

  assert.equal(report.passed, true);
  assert.deepEqual(report.issues, []);
  assert.match(getReadinessSummary(report), /QA readiness ok/);
  assert.equal(report.stats.storeCount > 0, true);
  assert.equal(report.stats.beerCount > 0, true);
});

test("seed readiness smoke catches broken references across discovery, users and orders", () => {
  const report = createReadinessReport({
    highlights: [
      {
        id: "broken-highlight",
        title: "Broken",
        subtitle: "Broken",
        badge: "Broken",
        targetType: "beer",
        targetId: "missing-beer",
      },
    ],
    campaigns: [
      {
        id: "broken-campaign",
        kicker: "Broken",
        title: "Broken",
        description: "Broken",
        ctaLabel: "Broken",
        targetType: "catalog",
      },
    ],
    buyersAndSellers: [
      {
        id: "seller-broken",
        email: "broken@choppnow.app",
        password: "123",
        name: "Broken Seller",
        role: "seller",
        avatarInitials: "BS",
        headline: "Broken",
        phone: "0",
        address: "Broken",
        favoriteBeerIds: ["missing-beer"],
        favoriteStoreIds: ["missing-store"],
        notificationsEnabled: true,
        sellerStoreId: "missing-store",
      },
    ],
    orders: [
      {
        id: "order-broken",
        buyerId: "missing-buyer",
        storeId: "missing-store",
        items: [{ beerId: "missing-beer", quantity: 1 }],
        total: "R$ 10,00",
        createdAt: "Hoje, 10:00",
        slaMinutes: 30,
        status: "placed",
      },
    ],
    filters: [
      {
        id: "duplicated",
        mode: "stores",
        label: "A",
        description: "A",
        criteria: {},
      },
      {
        id: "duplicated",
        mode: "beers",
        label: "B",
        description: "B",
        criteria: {},
      },
    ],
  });

  assert.equal(report.passed, false);
  assert.deepEqual(
    report.issues.map((issue) => issue.code).sort(),
    [
      "duplicate_filter_id",
      "missing_campaign_mode",
      "missing_favorite_beer",
      "missing_favorite_store",
      "missing_highlight_target",
      "missing_seller_store",
      "order_missing_beer",
      "order_missing_buyer",
      "order_missing_store",
    ]
  );
});
