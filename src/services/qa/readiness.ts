import {
  CatalogFilterPreset,
  DiscoveryCampaign,
  DiscoveryHighlight,
  catalogFilterPresets,
  homeCampaigns,
  homeHighlights,
} from "../../data/discovery";
import { initialOrders, OrderItemRecord } from "../../data/orders";
import { getAllBeers, initialStores, StoreItem } from "../../data/stores";
import { demoUsers, UserProfile } from "../../data/users";

export type ReadinessIssue = {
  code:
    | "duplicate_filter_id"
    | "invalid_filter_mode"
    | "empty_storytelling"
    | "missing_highlight_target"
    | "missing_campaign_mode"
    | "missing_favorite_beer"
    | "missing_favorite_store"
    | "missing_seller_store"
    | "seller_without_store_id"
    | "order_missing_buyer"
    | "order_missing_store"
    | "order_missing_beer";
  message: string;
};

export type ReadinessStats = {
  storeCount: number;
  beerCount: number;
  buyerCount: number;
  sellerCount: number;
  orderCount: number;
  highlightCount: number;
  campaignCount: number;
  filterCount: number;
};

export type ReadinessReport = {
  passed: boolean;
  issues: ReadinessIssue[];
  stats: ReadinessStats;
};

type ReadinessDataset = {
  stores?: StoreItem[];
  buyersAndSellers?: UserProfile[];
  orders?: OrderItemRecord[];
  highlights?: DiscoveryHighlight[];
  campaigns?: DiscoveryCampaign[];
  filters?: CatalogFilterPreset[];
};

function pushIssue(issues: ReadinessIssue[], issue: ReadinessIssue) {
  issues.push(issue);
}

function validateHighlights(
  highlights: DiscoveryHighlight[],
  validStoreIds: Set<string>,
  validBeerIds: Set<string>,
  issues: ReadinessIssue[]
) {
  highlights.forEach((highlight) => {
    if (highlight.targetType === "store" && (!highlight.targetId || !validStoreIds.has(highlight.targetId))) {
      pushIssue(issues, {
        code: "missing_highlight_target",
        message: `Highlight ${highlight.id} aponta para uma loja inexistente.`,
      });
    }

    if (highlight.targetType === "beer" && (!highlight.targetId || !validBeerIds.has(highlight.targetId))) {
      pushIssue(issues, {
        code: "missing_highlight_target",
        message: `Highlight ${highlight.id} aponta para uma cerveja inexistente.`,
      });
    }
  });
}

function validateCampaigns(campaigns: DiscoveryCampaign[], issues: ReadinessIssue[]) {
  campaigns.forEach((campaign) => {
    if (campaign.targetType === "catalog" && !campaign.catalogMode) {
      pushIssue(issues, {
        code: "missing_campaign_mode",
        message: `Campaign ${campaign.id} usa targetType catalog sem catalogMode.`,
      });
    }
  });
}

function validateFilters(filters: CatalogFilterPreset[], issues: ReadinessIssue[]) {
  const seenIds = new Set<string>();

  filters.forEach((filter) => {
    if (seenIds.has(filter.id)) {
      pushIssue(issues, {
        code: "duplicate_filter_id",
        message: `Filtro ${filter.id} esta duplicado.`,
      });
    }
    seenIds.add(filter.id);

    if (filter.mode !== "stores" && filter.mode !== "beers") {
      pushIssue(issues, {
        code: "invalid_filter_mode",
        message: `Filtro ${filter.id} usa mode invalido.`,
      });
    }
  });
}

function validateUsers(
  users: UserProfile[],
  validStoreIds: Set<string>,
  validBeerIds: Set<string>,
  issues: ReadinessIssue[]
) {
  users.forEach((user) => {
    user.favoriteStoreIds.forEach((storeId) => {
      if (!validStoreIds.has(storeId)) {
        pushIssue(issues, {
          code: "missing_favorite_store",
          message: `Usuario ${user.id} referencia loja favorita inexistente (${storeId}).`,
        });
      }
    });

    user.favoriteBeerIds.forEach((beerId) => {
      if (!validBeerIds.has(beerId)) {
        pushIssue(issues, {
          code: "missing_favorite_beer",
          message: `Usuario ${user.id} referencia cerveja favorita inexistente (${beerId}).`,
        });
      }
    });

    if (user.role === "seller" && !user.sellerStoreId) {
      pushIssue(issues, {
        code: "seller_without_store_id",
        message: `Conta seller ${user.id} nao possui sellerStoreId.`,
      });
    }

    if (user.role === "seller" && user.sellerStoreId && !validStoreIds.has(user.sellerStoreId)) {
      pushIssue(issues, {
        code: "missing_seller_store",
        message: `Conta seller ${user.id} aponta para loja inexistente (${user.sellerStoreId}).`,
      });
    }
  });
}

function validateOrders(
  orders: OrderItemRecord[],
  validUserIds: Set<string>,
  validStoreIds: Set<string>,
  validBeerIds: Set<string>,
  issues: ReadinessIssue[]
) {
  orders.forEach((order) => {
    if (!validUserIds.has(order.buyerId)) {
      pushIssue(issues, {
        code: "order_missing_buyer",
        message: `Pedido ${order.id} aponta para buyer inexistente (${order.buyerId}).`,
      });
    }

    if (!validStoreIds.has(order.storeId)) {
      pushIssue(issues, {
        code: "order_missing_store",
        message: `Pedido ${order.id} aponta para store inexistente (${order.storeId}).`,
      });
    }

    order.items.forEach((item) => {
      if (!validBeerIds.has(item.beerId)) {
        pushIssue(issues, {
          code: "order_missing_beer",
          message: `Pedido ${order.id} referencia cerveja inexistente (${item.beerId}).`,
        });
      }
    });
  });
}

export function createReadinessReport(dataset: ReadinessDataset = {}): ReadinessReport {
  const stores = dataset.stores ?? initialStores;
  const buyersAndSellers = dataset.buyersAndSellers ?? demoUsers;
  const orders = dataset.orders ?? initialOrders;
  const highlights = dataset.highlights ?? homeHighlights;
  const campaigns = dataset.campaigns ?? homeCampaigns;
  const filters = dataset.filters ?? catalogFilterPresets;

  const issues: ReadinessIssue[] = [];
  const beers = getAllBeers(stores);
  const validStoreIds = new Set(stores.map((store) => store.id));
  const validBeerIds = new Set(beers.map((beer) => beer.id));
  const validUserIds = new Set(buyersAndSellers.map((user) => user.id));

  validateHighlights(highlights, validStoreIds, validBeerIds, issues);
  validateCampaigns(campaigns, issues);
  validateFilters(filters, issues);
  validateUsers(buyersAndSellers, validStoreIds, validBeerIds, issues);
  validateOrders(orders, validUserIds, validStoreIds, validBeerIds, issues);

  if (highlights.length === 0 || campaigns.length === 0) {
    pushIssue(issues, {
      code: "empty_storytelling",
      message: "Landing/discovery ficou sem highlights ou campaigns.",
    });
  }

  return {
    passed: issues.length === 0,
    issues,
    stats: {
      storeCount: stores.length,
      beerCount: beers.length,
      buyerCount: buyersAndSellers.filter((user) => user.role === "buyer").length,
      sellerCount: buyersAndSellers.filter((user) => user.role === "seller").length,
      orderCount: orders.length,
      highlightCount: highlights.length,
      campaignCount: campaigns.length,
      filterCount: filters.length,
    },
  };
}

export function getReadinessSummary(report: ReadinessReport) {
  return report.passed
    ? `QA readiness ok: ${report.stats.storeCount} lojas, ${report.stats.beerCount} cervejas e ${report.stats.orderCount} pedidos seeds validados.`
    : `QA readiness falhou com ${report.issues.length} problema(s).`;
}
