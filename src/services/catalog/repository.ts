import {
  CatalogFilterPreset,
  CatalogModeRef,
  DiscoveryCampaign,
  DiscoveryHighlight,
  DiscoveryStoryStep,
  DiscoveryTargetType,
  catalogFilterPresets,
  discoveryStorySteps,
  homeCampaigns,
  homeHighlights,
} from "../../data/discovery";
import { BeerItem, StoreItem, initialStores } from "../../data/stores";
import { getItem, saveItem } from "../../utils/storage";
import { loadPersistedAuthHeaders } from "../auth/session";
import {
  buildCatalogRuntimeBeerRecords,
  createLocalCatalogBeerRecord,
  mergeCatalogSnapshotWithLocalProducts,
} from "./local-products";
import {
  CATALOG_DISCOVERY_SCHEMA_VERSION,
  CATALOG_DISCOVERY_VERSION_HEADER,
  CATALOG_INVENTORY_SYNC_PATH as CATALOG_SYNC_PATH,
  CATALOG_SNAPSHOT_PATH,
  type InventorySyncReason,
  SELLER_PRODUCTS_PATH,
} from "../contracts/catalog";
import type { CatalogBeerRuntimeRecord, CatalogLocalProductDraft } from "./local-products";
import {
  applyInventorySyncUpdatesToSnapshot,
  buildCreateSellerProductRequest,
  extractCatalogBeerFromMutationResponse,
  extractInventorySyncResponse,
  upsertCatalogBeerInSnapshot,
} from "./remote";

export type CatalogInventory = {
  availableUnits: number;
  isAvailable: boolean;
  lastSyncedAt: string;
};

export type CatalogBeerRecord = {
  id: string;
  storeId: string;
  name: string;
  style: string;
  abv: string;
  price: string;
  rating: number;
  description: string;
  ibu: number;
  inventory: CatalogInventory;
};

export type CatalogStoreRecord = {
  id: string;
  name: string;
  tag: string;
  short: string;
  description: string;
  address: string;
  rating: number;
};

export type CatalogSnapshot = {
  version: number;
  fetchedAt: string;
  stores: CatalogStoreRecord[];
  beers: CatalogBeerRecord[];
  discovery: {
    version: number;
    highlights: DiscoveryHighlight[];
    campaigns: DiscoveryCampaign[];
    storySteps: DiscoveryStoryStep[];
    filters: CatalogFilterPreset[];
  };
};

export type CatalogRuntimeData = {
  source: "api" | "cache" | "seed";
  snapshot: CatalogSnapshot;
  storesData: StoreItem[];
  inventoryRecords: CatalogBeerRuntimeRecord[];
  syncStatus: CatalogSyncStatus;
};

export type InventorySyncQueueItem = {
  id: string;
  beerId: string;
  availableUnits: number;
  reason: InventorySyncReason;
  queuedAt: string;
};

export type InventorySyncFlushStatus = "synced" | "no_pending" | "unavailable" | "failed";

export type CatalogSyncErrorCode =
  | "api_not_configured"
  | "backend_rejected"
  | "http_error"
  | "network_error"
  | "unknown";

export type CatalogRuntimeEnv = "development" | "stage" | "production";

export type InventorySyncFlushResult = {
  status: InventorySyncFlushStatus;
  attemptedCount: number;
  syncedCount: number;
  pendingCount: number;
  lastError: string | null;
  lastErrorCode: CatalogSyncErrorCode | null;
};

export type CatalogSyncStatus = {
  pendingCount: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorCode: CatalogSyncErrorCode | null;
};

export type FlushInventoryRetryOptions = {
  maxBatchSize?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  retryMultiplier?: number;
  maxRetryDelayMs?: number;
};

export type InventorySyncLogItem = {
  at: string;
  status: InventorySyncFlushStatus;
  attemptedCount: number;
  syncedCount: number;
  pendingCount: number;
  lastError: string | null;
  lastErrorCode: CatalogSyncErrorCode | null;
};

type CatalogSyncMetadata = {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorCode: CatalogSyncErrorCode | null;
};

type StoredCatalogSnapshotResult = {
  snapshot: CatalogSnapshot;
  source: "cache" | "seed";
};

type InventorySyncApiErrorPayload = {
  code?: string;
  message?: string;
};

const CATALOG_API_BASE_URL = process.env.EXPO_PUBLIC_CATALOG_API_BASE_URL?.trim();
const CATALOG_SNAPSHOT_KEY = "choppnow-catalog-snapshot";
const CATALOG_LOCAL_PRODUCTS_KEY = "choppnow-catalog-local-products";
const CATALOG_INVENTORY_OVERRIDE_KEY = "choppnow-catalog-inventory-overrides";
const CATALOG_SYNC_QUEUE_KEY = "choppnow-catalog-sync-queue";
const CATALOG_SYNC_META_KEY = "choppnow-catalog-sync-meta";
const CATALOG_SYNC_LOG_KEY = "choppnow-catalog-sync-log";
const CATALOG_LAST_SOURCE_KEY = "choppnow-catalog-last-source";
const DEFAULT_CATALOG_API_TIMEOUT_MS = 4500;
const DEFAULT_CATALOG_SNAPSHOT_TIMEOUT_MS = 3000;
const DEFAULT_CATALOG_SYNC_TIMEOUT_MS = 6000;
const DEFAULT_CATALOG_SNAPSHOT_RETRY_ATTEMPTS = 2;
const DEFAULT_CATALOG_SNAPSHOT_RETRY_DELAY_MS = 450;
const catalogConfigWarnings: string[] = [];
function pushConfigWarning(message: string) {
  if (!catalogConfigWarnings.includes(message)) {
    catalogConfigWarnings.push(message);
  }
}

function readNumericEnv(
  key: string,
  rawValue: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  if (rawValue === undefined || rawValue === null || rawValue.trim().length === 0) {
    return fallback;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    pushConfigWarning(`${key} invalido: "${rawValue}". Fallback para ${fallback}.`);
    return fallback;
  }
  const clamped = Math.max(min, Math.min(parsed, max));
  if (clamped !== parsed) {
    pushConfigWarning(`${key} fora da faixa (${min}-${max}): "${rawValue}". Usando ${clamped}.`);
  }
  return clamped;
}
const CATALOG_API_TIMEOUT_MS = Math.max(
  1000,
  readNumericEnv(
    "EXPO_PUBLIC_CATALOG_API_TIMEOUT_MS",
    process.env.EXPO_PUBLIC_CATALOG_API_TIMEOUT_MS,
    DEFAULT_CATALOG_API_TIMEOUT_MS,
    1000,
    20000
  )
);
const CATALOG_SNAPSHOT_TIMEOUT_MS = Math.max(
  1000,
  readNumericEnv(
    "EXPO_PUBLIC_CATALOG_SNAPSHOT_TIMEOUT_MS",
    process.env.EXPO_PUBLIC_CATALOG_SNAPSHOT_TIMEOUT_MS,
    DEFAULT_CATALOG_SNAPSHOT_TIMEOUT_MS,
    1000,
    20000
  )
);
const CATALOG_SYNC_TIMEOUT_MS = Math.max(
  1000,
  readNumericEnv(
    "EXPO_PUBLIC_CATALOG_SYNC_TIMEOUT_MS",
    process.env.EXPO_PUBLIC_CATALOG_SYNC_TIMEOUT_MS,
    DEFAULT_CATALOG_SYNC_TIMEOUT_MS,
    1000,
    30000
  )
);
const CATALOG_SNAPSHOT_RETRY_ATTEMPTS = Math.max(
  1,
  Math.min(
    readNumericEnv(
      "EXPO_PUBLIC_CATALOG_SNAPSHOT_RETRY_ATTEMPTS",
      process.env.EXPO_PUBLIC_CATALOG_SNAPSHOT_RETRY_ATTEMPTS,
      DEFAULT_CATALOG_SNAPSHOT_RETRY_ATTEMPTS,
      1,
      4
    ),
    4
  )
);
const CATALOG_SNAPSHOT_RETRY_DELAY_MS = Math.max(
  200,
  Math.min(
    readNumericEnv(
      "EXPO_PUBLIC_CATALOG_SNAPSHOT_RETRY_DELAY_MS",
      process.env.EXPO_PUBLIC_CATALOG_SNAPSHOT_RETRY_DELAY_MS,
      DEFAULT_CATALOG_SNAPSHOT_RETRY_DELAY_MS,
      200,
      3000
    ),
    3000
  )
);
const DEFAULT_SYNC_RETRY_ATTEMPTS = 2;
const DEFAULT_SYNC_RETRY_DELAY_MS = 700;
const DEFAULT_SYNC_RETRY_MULTIPLIER = 1.7;
const DEFAULT_SYNC_MAX_RETRY_DELAY_MS = 3000;
const CATALOG_RUNTIME_ENV_RAW = (
  process.env.EXPO_PUBLIC_APP_ENV ??
  process.env.NODE_ENV ??
  "development"
)
  .trim()
  .toLowerCase();
function resolveCatalogRuntimeEnv(rawValue: string): CatalogRuntimeEnv {
  if (rawValue === "prod" || rawValue === "production") return "production";
  if (rawValue === "stage" || rawValue === "staging") return "stage";
  return "development";
}
const CATALOG_RUNTIME_ENV = resolveCatalogRuntimeEnv(CATALOG_RUNTIME_ENV_RAW);
const CATALOG_DEBUG_WARNINGS_ENABLED = String(
  process.env.EXPO_PUBLIC_CATALOG_DEBUG_WARNINGS ?? ""
).toLowerCase() === "true";
const SHOULD_EXPOSE_CONFIG_WARNINGS =
  CATALOG_RUNTIME_ENV !== "production" || CATALOG_DEBUG_WARNINGS_ENABLED;
const CATALOG_RETRY_PRESETS = {
  development: {
    attempts: 2,
    baseDelayMs: 500,
    multiplier: 1.5,
    maxDelayMs: 2500,
  },
  stage: {
    attempts: 3,
    baseDelayMs: 700,
    multiplier: 1.7,
    maxDelayMs: 3500,
  },
  production: {
    attempts: 3,
    baseDelayMs: 900,
    multiplier: 2,
    maxDelayMs: 5000,
  },
} as const;
const CATALOG_RETRY_PRESET =
  CATALOG_RUNTIME_ENV === "production"
    ? CATALOG_RETRY_PRESETS.production
    : CATALOG_RUNTIME_ENV === "stage"
      ? CATALOG_RETRY_PRESETS.stage
      : CATALOG_RETRY_PRESETS.development;
const CATALOG_SYNC_RETRY_ATTEMPTS = Math.max(
  1,
  Math.min(
    readNumericEnv(
      "EXPO_PUBLIC_CATALOG_SYNC_RETRY_ATTEMPTS",
      process.env.EXPO_PUBLIC_CATALOG_SYNC_RETRY_ATTEMPTS,
      CATALOG_RETRY_PRESET.attempts,
      1,
      4
    ),
    4
  )
);
const CATALOG_SYNC_RETRY_DELAY_MS = Math.max(
  200,
  Math.min(
    readNumericEnv(
      "EXPO_PUBLIC_CATALOG_SYNC_RETRY_DELAY_MS",
      process.env.EXPO_PUBLIC_CATALOG_SYNC_RETRY_DELAY_MS,
      CATALOG_RETRY_PRESET.baseDelayMs,
      200,
      5000
    ),
    5000
  )
);
const CATALOG_SYNC_RETRY_MULTIPLIER = Math.max(
  1,
  Math.min(
    readNumericEnv(
      "EXPO_PUBLIC_CATALOG_SYNC_RETRY_MULTIPLIER",
      process.env.EXPO_PUBLIC_CATALOG_SYNC_RETRY_MULTIPLIER,
      CATALOG_RETRY_PRESET.multiplier,
      1,
      3
    ),
    3
  )
);
const CATALOG_SYNC_RETRY_MAX_DELAY_MS = Math.max(
  200,
  Math.min(
    readNumericEnv(
      "EXPO_PUBLIC_CATALOG_SYNC_RETRY_MAX_DELAY_MS",
      process.env.EXPO_PUBLIC_CATALOG_SYNC_RETRY_MAX_DELAY_MS,
      CATALOG_RETRY_PRESET.maxDelayMs,
      200,
      10000
    ),
    10000
  )
);
const BACKEND_CODE_TO_SYNC_ERROR: Record<string, CatalogSyncErrorCode> = {
  CATALOG_SYNC_REJECTED: "backend_rejected",
  STOCK_CONFLICT: "backend_rejected",
  VALIDATION_ERROR: "backend_rejected",
  RATE_LIMITED: "http_error",
};
export const VISIBLE_BACKEND_SYNC_ERROR_CODES = ["STOCK_CONFLICT", "RATE_LIMITED", "VALIDATION_ERROR"] as const;
export type { CatalogBeerRuntimeRecord, CatalogLocalProductDraft } from "./local-products";

export const catalogApiContract = {
  runtimeEnv: CATALOG_RUNTIME_ENV,
  runtimeEnvRaw: CATALOG_RUNTIME_ENV_RAW,
  snapshotPath: CATALOG_SNAPSHOT_PATH,
  inventorySyncPath: CATALOG_SYNC_PATH,
  sellerProductsPath: SELLER_PRODUCTS_PATH,
  discovery: {
    schemaVersion: CATALOG_DISCOVERY_SCHEMA_VERSION,
    maxSupportedSchemaVersion: CATALOG_DISCOVERY_SCHEMA_VERSION,
    requiredKeys: ["version", "highlights", "campaigns", "storySteps", "filters"] as const,
    requestHeader: CATALOG_DISCOVERY_VERSION_HEADER,
    responseHeader: CATALOG_DISCOVERY_VERSION_HEADER,
  },
  syncErrorCodeMap: BACKEND_CODE_TO_SYNC_ERROR,
  visibleSyncErrorCodes: VISIBLE_BACKEND_SYNC_ERROR_CODES,
  timeoutMs: {
    default: CATALOG_API_TIMEOUT_MS,
    snapshot: CATALOG_SNAPSHOT_TIMEOUT_MS,
    inventorySync: CATALOG_SYNC_TIMEOUT_MS,
  },
  retryPolicy: {
    snapshot: {
      attempts: CATALOG_SNAPSHOT_RETRY_ATTEMPTS,
      baseDelayMs: CATALOG_SNAPSHOT_RETRY_DELAY_MS,
    },
    attempts: CATALOG_SYNC_RETRY_ATTEMPTS,
    baseDelayMs: CATALOG_SYNC_RETRY_DELAY_MS,
    multiplier: CATALOG_SYNC_RETRY_MULTIPLIER,
    maxDelayMs: CATALOG_SYNC_RETRY_MAX_DELAY_MS,
    presetBase: CATALOG_RETRY_PRESET,
  },
  configWarnings: SHOULD_EXPOSE_CONFIG_WARNINGS ? catalogConfigWarnings : [],
};

export function getCatalogConfigWarnings() {
  if (!SHOULD_EXPOSE_CONFIG_WARNINGS) return [];
  return [...catalogConfigWarnings];
}

function mapBackendCodeToSyncError(code: string | null): CatalogSyncErrorCode {
  if (!code) return "http_error";
  return BACKEND_CODE_TO_SYNC_ERROR[code] ?? "backend_rejected";
}

function isCatalogInventory(value: unknown): value is CatalogInventory {
  if (!value || typeof value !== "object") return false;

  const inventory = value as CatalogInventory;
  return (
    typeof inventory.availableUnits === "number" &&
    typeof inventory.isAvailable === "boolean" &&
    typeof inventory.lastSyncedAt === "string"
  );
}

function isCatalogBeerRecord(value: unknown): value is CatalogBeerRecord {
  if (!value || typeof value !== "object") return false;

  const beer = value as CatalogBeerRecord;
  return (
    typeof beer.id === "string" &&
    typeof beer.storeId === "string" &&
    typeof beer.name === "string" &&
    typeof beer.style === "string" &&
    typeof beer.abv === "string" &&
    typeof beer.price === "string" &&
    typeof beer.rating === "number" &&
    typeof beer.description === "string" &&
    typeof beer.ibu === "number" &&
    isCatalogInventory(beer.inventory)
  );
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = CATALOG_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildSeedSnapshot(): CatalogSnapshot {
  const nowIso = new Date().toISOString();
  const stores = initialStores.map((store) => ({
    id: store.id,
    name: store.name,
    tag: store.tag,
    short: store.short,
    description: store.description,
    address: store.address,
    rating: store.rating,
  }));

  const beers = initialStores.flatMap((store) =>
    store.beers.map((beer) => ({
      ...beer,
      storeId: store.id,
      inventory: {
        availableUnits: 120,
        isAvailable: true,
        lastSyncedAt: nowIso,
      },
    }))
  );

  return {
    version: 1,
    fetchedAt: nowIso,
    stores,
    beers,
    discovery: {
      version: CATALOG_DISCOVERY_SCHEMA_VERSION,
      highlights: homeHighlights,
      campaigns: homeCampaigns,
      storySteps: discoveryStorySteps,
      filters: catalogFilterPresets,
    },
  };
}

async function loadCatalogLocalProducts() {
  const stored = await getItem<unknown>(CATALOG_LOCAL_PRODUCTS_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.filter(isCatalogBeerRecord);
}

async function saveCatalogLocalProducts(products: CatalogBeerRecord[]) {
  await saveItem(CATALOG_LOCAL_PRODUCTS_KEY, products);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function readStringField(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readNumberField(value: unknown, fallback: number, options?: { min?: number; max?: number }) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  if (typeof options?.min === "number" && parsed < options.min) return options.min;
  if (typeof options?.max === "number" && parsed > options.max) return options.max;
  return parsed;
}

function readOptionalNumberField(
  value: unknown,
  fallback: number | undefined,
  options?: { min?: number; max?: number }
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  if (typeof options?.min === "number" && value < options.min) return options.min;
  if (typeof options?.max === "number" && value > options.max) return options.max;
  return value;
}

const DISCOVERY_TARGET_TYPES: DiscoveryTargetType[] = ["store", "beer", "catalog", "search"];
const DISCOVERY_CATALOG_MODES: CatalogModeRef[] = ["stores", "beers"];

function normalizeDiscoveryTargetType(value: unknown, fallback: DiscoveryTargetType): DiscoveryTargetType {
  if (typeof value === "string" && DISCOVERY_TARGET_TYPES.includes(value as DiscoveryTargetType)) {
    return value as DiscoveryTargetType;
  }
  return fallback;
}

function normalizeCatalogMode(value: unknown, fallback: CatalogModeRef): CatalogModeRef {
  if (typeof value === "string" && DISCOVERY_CATALOG_MODES.includes(value as CatalogModeRef)) {
    return value as CatalogModeRef;
  }
  return fallback;
}

function normalizeDiscoveryHighlights(
  highlightsRaw: unknown,
  fallback: DiscoveryHighlight[],
  validStoreIds: Set<string>,
  validBeerIds: Set<string>
): DiscoveryHighlight[] {
  if (!Array.isArray(highlightsRaw)) return fallback;

  const normalized = highlightsRaw.reduce<DiscoveryHighlight[]>((acc, item, index) => {
    if (!isObjectRecord(item)) return acc;
    const seedItem = fallback[index % fallback.length];
    const targetType = normalizeDiscoveryTargetType(item.targetType, seedItem.targetType);
    const targetId = typeof item.targetId === "string" ? item.targetId : seedItem.targetId;
    const catalogMode = normalizeCatalogMode(item.catalogMode, seedItem.catalogMode ?? "beers");
    if ((targetType === "beer" || targetType === "store") && (!targetId || targetId.length === 0)) {
      return acc;
    }
    if (targetType === "store" && targetId && !validStoreIds.has(targetId)) {
      return acc;
    }
    if (targetType === "beer" && targetId && !validBeerIds.has(targetId)) {
      return acc;
    }
    acc.push({
      id: readStringField(item.id, seedItem.id),
      title: readStringField(item.title, seedItem.title),
      subtitle: readStringField(item.subtitle, seedItem.subtitle),
      badge: readStringField(item.badge, seedItem.badge),
      targetType,
      ...(targetId ? { targetId } : {}),
      ...(targetType === "catalog" ? { catalogMode } : {}),
    });
    return acc;
  }, []);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeDiscoveryCampaigns(
  campaignsRaw: unknown,
  fallback: DiscoveryCampaign[]
): DiscoveryCampaign[] {
  if (!Array.isArray(campaignsRaw)) return fallback;

  const normalized = campaignsRaw.reduce<DiscoveryCampaign[]>((acc, item, index) => {
    if (!isObjectRecord(item)) return acc;
    const seedItem = fallback[index % fallback.length];
    const targetType = normalizeDiscoveryTargetType(item.targetType, seedItem.targetType);
    if (targetType === "store" || targetType === "beer") {
      return acc;
    }
    const catalogMode = normalizeCatalogMode(item.catalogMode, seedItem.catalogMode ?? "beers");
    acc.push({
      id: readStringField(item.id, seedItem.id),
      kicker: readStringField(item.kicker, seedItem.kicker),
      title: readStringField(item.title, seedItem.title),
      description: readStringField(item.description, seedItem.description),
      ctaLabel: readStringField(item.ctaLabel, seedItem.ctaLabel),
      targetType,
      ...(targetType === "catalog" ? { catalogMode } : {}),
    });
    return acc;
  }, []);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeDiscoveryStory(storyRaw: unknown, fallback: DiscoveryStoryStep[]): DiscoveryStoryStep[] {
  if (!Array.isArray(storyRaw)) return fallback;

  const normalized = storyRaw.reduce<DiscoveryStoryStep[]>((acc, item, index) => {
    if (!isObjectRecord(item)) return acc;
    const seedItem = fallback[index % fallback.length];
    acc.push({
      id: readStringField(item.id, seedItem.id),
      title: readStringField(item.title, seedItem.title),
      description: readStringField(item.description, seedItem.description),
    });
    return acc;
  }, []);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeFilterCriteriaList(valuesRaw: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(valuesRaw)) return fallback;
  const normalized = valuesRaw
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeCatalogFilters(filtersRaw: unknown, fallback: CatalogFilterPreset[]): CatalogFilterPreset[] {
  if (!Array.isArray(filtersRaw)) return fallback;

  const usedIds = new Set<string>();
  const normalized = filtersRaw.reduce<CatalogFilterPreset[]>((acc, item, index) => {
    if (!isObjectRecord(item)) return acc;
    const seedItem = fallback[index % fallback.length];
    const id = readStringField(item.id, seedItem.id);
    if (usedIds.has(id)) return acc;
    const mode = normalizeCatalogMode(item.mode, seedItem.mode);
    const rawCriteria = isObjectRecord(item.criteria) ? item.criteria : {};
    acc.push({
      id,
      mode,
      label: readStringField(item.label, seedItem.label),
      description: readStringField(item.description, seedItem.description),
      criteria: {
        minRating: readOptionalNumberField(rawCriteria.minRating, seedItem.criteria.minRating, { min: 0, max: 5 }),
        maxPrice: readOptionalNumberField(rawCriteria.maxPrice, seedItem.criteria.maxPrice, { min: 0 }),
        minIbu: readOptionalNumberField(rawCriteria.minIbu, seedItem.criteria.minIbu, { min: 0 }),
        maxIbu: readOptionalNumberField(rawCriteria.maxIbu, seedItem.criteria.maxIbu, { min: 0 }),
        styles: normalizeFilterCriteriaList(rawCriteria.styles, seedItem.criteria.styles ?? []),
        addressIncludes: normalizeFilterCriteriaList(
          rawCriteria.addressIncludes,
          seedItem.criteria.addressIncludes ?? []
        ),
        tagIncludes: normalizeFilterCriteriaList(rawCriteria.tagIncludes, seedItem.criteria.tagIncludes ?? []),
      },
    });
    usedIds.add(id);
    return acc;
  }, []);

  return normalized.length > 0 ? normalized : fallback;
}

function parseCatalogSnapshot(
  payload: unknown,
  options?: { responseDiscoveryVersion: number | null }
): CatalogSnapshot | null {
  if (!payload || typeof payload !== "object") return null;

  const maybeObject = payload as Record<string, unknown>;
  const rawSnapshot =
    maybeObject.snapshot && typeof maybeObject.snapshot === "object"
      ? (maybeObject.snapshot as Record<string, unknown>)
      : maybeObject;

  if (!Array.isArray(rawSnapshot.stores) || !Array.isArray(rawSnapshot.beers)) {
    return null;
  }

  const seed = buildSeedSnapshot();
  const seedStoresById = seed.stores.reduce<Record<string, CatalogStoreRecord>>((acc, store) => {
    acc[store.id] = store;
    return acc;
  }, {});
  const seedBeersById = seed.beers.reduce<Record<string, CatalogBeerRecord>>((acc, beer) => {
    acc[beer.id] = beer;
    return acc;
  }, {});
  const discoveryRaw =
    rawSnapshot.discovery && typeof rawSnapshot.discovery === "object"
      ? (rawSnapshot.discovery as Record<string, unknown>)
      : {};
  const stores = rawSnapshot.stores.reduce<CatalogStoreRecord[]>((acc, item, index) => {
    if (!isObjectRecord(item)) return acc;
    const id = readStringField(item.id, "");
    if (!id) return acc;
    const seedStore = seedStoresById[id];
    acc.push({
      id,
      name: readStringField(item.name, seedStore?.name ?? `Cervejaria ${index + 1}`),
      tag: readStringField(item.tag, seedStore?.tag ?? "catalogo"),
      short: readStringField(item.short, seedStore?.short ?? "LO"),
      description: readStringField(item.description, seedStore?.description ?? "Loja sem descricao."),
      address: readStringField(item.address, seedStore?.address ?? "Endereco nao informado"),
      rating: readNumberField(item.rating, seedStore?.rating ?? 4, { min: 0, max: 5 }),
    });
    return acc;
  }, []);

  const rawStoreIds = new Set(stores.map((store) => store.id));
  const nowIso = new Date().toISOString();
  const beers = rawSnapshot.beers.reduce<CatalogBeerRecord[]>((acc, item, index) => {
    if (!isObjectRecord(item)) return acc;
    const id = readStringField(item.id, "");
    if (!id) return acc;
    const seedBeer = seedBeersById[id];
    const storeId = readStringField(item.storeId, seedBeer?.storeId ?? "");
    if (!storeId || !rawStoreIds.has(storeId)) return acc;
    const inventoryRaw = isObjectRecord(item.inventory) ? item.inventory : {};
    const availableUnits = Math.max(
      0,
      Math.round(
        readNumberField(inventoryRaw.availableUnits, seedBeer?.inventory.availableUnits ?? 0, { min: 0 })
      )
    );
    const isAvailable =
      typeof inventoryRaw.isAvailable === "boolean"
        ? inventoryRaw.isAvailable
        : seedBeer?.inventory.isAvailable ?? availableUnits > 0;
    acc.push({
      id,
      storeId,
      name: readStringField(item.name, seedBeer?.name ?? `Cerveja ${index + 1}`),
      style: readStringField(item.style, seedBeer?.style ?? "Pilsen"),
      abv: readStringField(item.abv, seedBeer?.abv ?? "0%"),
      price: readStringField(item.price, seedBeer?.price ?? "R$ 0,00"),
      rating: readNumberField(item.rating, seedBeer?.rating ?? 4, { min: 0, max: 5 }),
      description: readStringField(item.description, seedBeer?.description ?? "Rotulo sem descricao."),
      ibu: readNumberField(item.ibu, seedBeer?.ibu ?? 0, { min: 0 }),
      inventory: {
        availableUnits,
        isAvailable,
        lastSyncedAt: readStringField(inventoryRaw.lastSyncedAt, seedBeer?.inventory.lastSyncedAt ?? nowIso),
      },
    });
    return acc;
  }, []);

  const normalizedStores = stores.length > 0 ? stores : seed.stores;
  const normalizedBeers = beers.length > 0 ? beers : seed.beers;
  const validStoreIds = new Set(normalizedStores.map((store) => store.id));
  const validBeerIds = new Set(normalizedBeers.map((beer) => beer.id));
  const bodyDiscoveryVersion =
    typeof discoveryRaw.version === "number" && Number.isFinite(discoveryRaw.version)
      ? Math.max(1, Math.round(discoveryRaw.version))
      : null;
  const responseDiscoveryVersion =
    typeof options?.responseDiscoveryVersion === "number" && Number.isFinite(options.responseDiscoveryVersion)
      ? Math.max(1, Math.round(options.responseDiscoveryVersion))
      : null;
  if (
    typeof bodyDiscoveryVersion === "number" &&
    typeof responseDiscoveryVersion === "number" &&
    bodyDiscoveryVersion !== responseDiscoveryVersion
  ) {
    pushConfigWarning(
      `divergencia de discovery.version (body=${bodyDiscoveryVersion}, header=${responseDiscoveryVersion}).`
    );
  }
  const remoteDiscoveryVersion =
    bodyDiscoveryVersion ?? responseDiscoveryVersion ?? CATALOG_DISCOVERY_SCHEMA_VERSION;
  const shouldUseRemoteDiscovery = remoteDiscoveryVersion <= CATALOG_DISCOVERY_SCHEMA_VERSION;
  if (!shouldUseRemoteDiscovery) {
    pushConfigWarning(
      `discovery.version ${remoteDiscoveryVersion} nao suportada. Usando fallback local da secao discovery.`
    );
  }

  return {
    version: typeof rawSnapshot.version === "number" ? rawSnapshot.version : seed.version,
    fetchedAt:
      typeof rawSnapshot.fetchedAt === "string" ? rawSnapshot.fetchedAt : new Date().toISOString(),
    stores: normalizedStores,
    beers: normalizedBeers,
    discovery: {
      version: remoteDiscoveryVersion,
      highlights: shouldUseRemoteDiscovery
        ? normalizeDiscoveryHighlights(
            discoveryRaw.highlights,
            seed.discovery.highlights,
            validStoreIds,
            validBeerIds
          )
        : seed.discovery.highlights,
      campaigns: shouldUseRemoteDiscovery
        ? normalizeDiscoveryCampaigns(discoveryRaw.campaigns, seed.discovery.campaigns)
        : seed.discovery.campaigns,
      storySteps: shouldUseRemoteDiscovery
        ? normalizeDiscoveryStory(discoveryRaw.storySteps, seed.discovery.storySteps)
        : seed.discovery.storySteps,
      filters: shouldUseRemoteDiscovery
        ? normalizeCatalogFilters(discoveryRaw.filters, seed.discovery.filters)
        : seed.discovery.filters,
    },
  };
}

function buildStoreItems(
  snapshot: CatalogSnapshot,
  inventoryRecords: CatalogBeerRuntimeRecord[]
): StoreItem[] {
  const beersByStore = inventoryRecords.reduce<Record<string, BeerItem[]>>((acc, beer) => {
    if (!beer.currentIsAvailable) {
      return acc;
    }

    if (!acc[beer.storeId]) {
      acc[beer.storeId] = [];
    }

    acc[beer.storeId].push({
      id: beer.id,
      name: beer.name,
      style: beer.style,
      abv: beer.abv,
      price: beer.price,
      rating: beer.rating,
      description: beer.description,
      ibu: beer.ibu,
      inventory: {
        availableUnits: beer.currentAvailableUnits,
        isAvailable: beer.currentIsAvailable,
        lastSyncedAt: beer.inventory.lastSyncedAt,
      },
      isLocalOnly: beer.isLocalOnly,
    });
    return acc;
  }, {});

  return snapshot.stores
    .map((store) => ({
      id: store.id,
      name: store.name,
      tag: store.tag,
      short: store.short,
      description: store.description,
      address: store.address,
      rating: store.rating,
      beers: beersByStore[store.id] ?? [],
    }))
    .filter((store) => store.beers.length > 0);
}

async function fetchCatalogSnapshotFromApi(): Promise<CatalogSnapshot | null> {
  if (!CATALOG_API_BASE_URL) return null;

  const response = await fetchWithTimeout(
    `${CATALOG_API_BASE_URL}${CATALOG_SNAPSHOT_PATH}`,
    {
      headers: {
        Accept: "application/json",
        [CATALOG_DISCOVERY_VERSION_HEADER]: String(CATALOG_DISCOVERY_SCHEMA_VERSION),
      },
    },
    CATALOG_SNAPSHOT_TIMEOUT_MS
  );
  if (!response.ok) {
    throw new Error(`Catalog API returned ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const responseDiscoveryVersionRaw = response.headers.get(CATALOG_DISCOVERY_VERSION_HEADER);
  const responseDiscoveryVersion =
    typeof responseDiscoveryVersionRaw === "string" && responseDiscoveryVersionRaw.trim().length > 0
      ? Number(responseDiscoveryVersionRaw)
      : null;
  return parseCatalogSnapshot(payload, { responseDiscoveryVersion });
}

async function createCatalogProductInApi(
  storeId: string,
  draft: CatalogLocalProductDraft
): Promise<CatalogBeerRecord | null> {
  if (!CATALOG_API_BASE_URL) return null;
  const authHeaders = await loadPersistedAuthHeaders();

  const response = await fetchWithTimeout(
    `${CATALOG_API_BASE_URL}${SELLER_PRODUCTS_PATH}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(buildCreateSellerProductRequest(storeId, draft)),
    },
    CATALOG_API_TIMEOUT_MS
  );

  if (!response.ok) {
    let payload: InventorySyncApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as InventorySyncApiErrorPayload;
    } catch {
      payload = null;
    }

    const payloadMessage =
      typeof payload?.message === "string" && payload.message.trim().length > 0
        ? payload.message
        : `Catalog product publish returned ${response.status}`;
    throw new Error(payloadMessage);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const product = extractCatalogBeerFromMutationResponse(payload);
  if (!product) {
    throw new Error("Catalog product publish returned an invalid payload.");
  }

  return product;
}

function waitSnapshotRetryDelay(attempt: number) {
  const nextDelay = Math.max(200, Math.round(CATALOG_SNAPSHOT_RETRY_DELAY_MS * attempt));
  return new Promise((resolve) => setTimeout(resolve, nextDelay));
}

async function fetchCatalogSnapshotFromApiWithRetry(): Promise<CatalogSnapshot | null> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= CATALOG_SNAPSHOT_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await fetchCatalogSnapshotFromApi();
    } catch (error) {
      lastError = error;
      if (attempt >= CATALOG_SNAPSHOT_RETRY_ATTEMPTS) break;
      await waitSnapshotRetryDelay(attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Catalog snapshot retry failed");
}

async function loadStoredCatalogSnapshotOrSeed(): Promise<StoredCatalogSnapshotResult> {
  const cachedSnapshot = await getItem<CatalogSnapshot>(CATALOG_SNAPSHOT_KEY);
  if (cachedSnapshot) {
    const normalizedCachedSnapshot = parseCatalogSnapshot(cachedSnapshot);
    if (normalizedCachedSnapshot) {
      await saveItem(CATALOG_SNAPSHOT_KEY, normalizedCachedSnapshot);
      return {
        snapshot: normalizedCachedSnapshot,
        source: "cache",
      };
    }
  }

  const seedSnapshot = buildSeedSnapshot();
  await saveItem(CATALOG_SNAPSHOT_KEY, seedSnapshot);
  return {
    snapshot: seedSnapshot,
    source: "seed",
  };
}

export async function loadCatalogRuntimeData(): Promise<CatalogRuntimeData> {
  const [inventoryOverrides, localProducts] = await Promise.all([
    getItem<Record<string, number>>(CATALOG_INVENTORY_OVERRIDE_KEY),
    loadCatalogLocalProducts(),
  ]);
  const safeInventoryOverrides = inventoryOverrides ?? {};

  try {
    const apiSnapshot = await fetchCatalogSnapshotFromApiWithRetry();
    if (apiSnapshot) {
      await saveItem(CATALOG_SNAPSHOT_KEY, apiSnapshot);
      return buildRuntimeDataFromSnapshot("api", apiSnapshot, safeInventoryOverrides, localProducts);
    }
  } catch {
    // Fallback order: cached snapshot, then seed snapshot.
  }

  const fallbackSnapshot = await loadStoredCatalogSnapshotOrSeed();
  return buildRuntimeDataFromSnapshot(
    fallbackSnapshot.source,
    fallbackSnapshot.snapshot,
    safeInventoryOverrides,
    localProducts
  );
}

export async function queueInventoryAdjustment(
  beerId: string,
  deltaUnits: number,
  reason: InventorySyncReason
) {
  const [baseSnapshot, localProducts] = await Promise.all([
    loadStoredCatalogSnapshotOrSeed(),
    loadCatalogLocalProducts(),
  ]);
  const snapshot = mergeCatalogSnapshotWithLocalProducts(baseSnapshot.snapshot, localProducts);
  const currentOverrides =
    (await getItem<Record<string, number>>(CATALOG_INVENTORY_OVERRIDE_KEY)) ?? {};
  const localProductIds = new Set(localProducts.map((item) => item.id));

  const beerRecord = snapshot.beers.find((item) => item.id === beerId);
  if (!beerRecord) return;

  const baselineUnits =
    typeof currentOverrides[beerId] === "number" ? currentOverrides[beerId] : beerRecord.inventory.availableUnits;

  const nextUnits = Math.max(0, baselineUnits + deltaUnits);
  const nextOverrides = {
    ...currentOverrides,
    [beerId]: nextUnits,
  };

  const pendingQueue = (await getItem<InventorySyncQueueItem[]>(CATALOG_SYNC_QUEUE_KEY)) ?? [];
  const nextQueue: InventorySyncQueueItem[] = [
    ...pendingQueue,
    {
      id: `sync-${Date.now()}-${beerId}`,
      beerId,
      availableUnits: nextUnits,
      reason,
      queuedAt: new Date().toISOString(),
    },
  ];

  if (localProductIds.has(beerId)) {
    const localNowIso = new Date().toISOString();
    const nextLocalProducts = localProducts.map((product) =>
      product.id === beerId
        ? {
            ...product,
            inventory: {
              availableUnits: nextUnits,
              isAvailable: nextUnits > 0,
              lastSyncedAt: localNowIso,
            },
          }
        : product
    );
    await Promise.all([
      saveItem(CATALOG_INVENTORY_OVERRIDE_KEY, nextOverrides),
      saveCatalogLocalProducts(nextLocalProducts),
    ]);
    return;
  }

  await Promise.all([
    saveItem(CATALOG_INVENTORY_OVERRIDE_KEY, nextOverrides),
    saveItem(CATALOG_SYNC_QUEUE_KEY, nextQueue),
  ]);
}

export async function publishCatalogProduct(storeId: string, draft: CatalogLocalProductDraft) {
  const [baseSnapshot, localProducts, currentOverrides] = await Promise.all([
    loadStoredCatalogSnapshotOrSeed(),
    loadCatalogLocalProducts(),
    getItem<Record<string, number>>(CATALOG_INVENTORY_OVERRIDE_KEY),
  ]);

  const storeExists = baseSnapshot.snapshot.stores.some((store) => store.id === storeId);
  if (!storeExists) {
    throw new Error("Loja nao encontrada para publicar o produto.");
  }

  try {
    const remoteProduct = await createCatalogProductInApi(storeId, draft);
    if (remoteProduct) {
      const nextSnapshot = upsertCatalogBeerInSnapshot(baseSnapshot.snapshot, remoteProduct);
      const nextLocalProducts = localProducts.filter((product) => product.id !== remoteProduct.id);
      const nextOverrides = {
        ...(currentOverrides ?? {}),
      };
      delete nextOverrides[remoteProduct.id];

      await Promise.all([
        saveItem(CATALOG_SNAPSHOT_KEY, nextSnapshot),
        saveCatalogLocalProducts(nextLocalProducts),
        saveItem(CATALOG_INVENTORY_OVERRIDE_KEY, nextOverrides),
      ]);

      const runtimeRecords = buildCatalogRuntimeBeerRecords(
        nextSnapshot,
        nextOverrides,
        new Set(nextLocalProducts.map((beer) => beer.id))
      );

      const createdRecord = runtimeRecords.find((beer) => beer.id === remoteProduct.id);
      if (!createdRecord) {
        throw new Error("Produto remoto criado, mas nao foi possivel materializar o runtime do catalogo.");
      }

      return createdRecord;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const shouldFallbackToLocal =
      message.includes("failed to fetch") ||
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("aborted") ||
      message.includes("timeout");

    if (!shouldFallbackToLocal) {
      throw error instanceof Error ? error : new Error("Falha ao publicar produto no backend.");
    }
  }

  const nextProduct = createLocalCatalogBeerRecord(
    storeId,
    draft,
    [...baseSnapshot.snapshot.beers, ...localProducts].map((beer) => beer.id)
  );
  const nextLocalProducts = [...localProducts, nextProduct];
  const nextOverrides = {
    ...(currentOverrides ?? {}),
    [nextProduct.id]: nextProduct.inventory.availableUnits,
  };

  await Promise.all([
    saveCatalogLocalProducts(nextLocalProducts),
    saveItem(CATALOG_INVENTORY_OVERRIDE_KEY, nextOverrides),
  ]);

  const mergedSnapshot = mergeCatalogSnapshotWithLocalProducts(baseSnapshot.snapshot, nextLocalProducts);
  const runtimeRecords = buildCatalogRuntimeBeerRecords(
    mergedSnapshot,
    nextOverrides,
    new Set(nextLocalProducts.map((beer) => beer.id))
  );

  const createdRecord = runtimeRecords.find((beer) => beer.id === nextProduct.id);
  if (!createdRecord) {
    throw new Error("Produto publicado, mas nao foi possivel materializar o runtime do catalogo.");
  }

  return createdRecord;
}

export async function getPendingInventorySyncCount() {
  const pendingQueue = (await getItem<InventorySyncQueueItem[]>(CATALOG_SYNC_QUEUE_KEY)) ?? [];
  return pendingQueue.length;
}

async function getCatalogSyncMetadata(): Promise<CatalogSyncMetadata> {
  return (
    (await getItem<CatalogSyncMetadata>(CATALOG_SYNC_META_KEY)) ?? {
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
      lastErrorCode: null,
    }
  );
}

async function saveCatalogSyncMetadata(metadata: CatalogSyncMetadata) {
  await saveItem(CATALOG_SYNC_META_KEY, metadata);
}

function waitFor(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getRetryDelayMs(
  attemptNumber: number,
  baseDelayMs: number,
  retryMultiplier: number,
  maxRetryDelayMs: number
) {
  const scaledDelay = Math.round(baseDelayMs * Math.pow(retryMultiplier, Math.max(0, attemptNumber - 1)));
  return Math.min(maxRetryDelayMs, Math.max(200, scaledDelay));
}

async function appendInventorySyncLog(result: InventorySyncFlushResult) {
  const current = (await getItem<InventorySyncLogItem[]>(CATALOG_SYNC_LOG_KEY)) ?? [];
  const next: InventorySyncLogItem[] = [
    {
      at: new Date().toISOString(),
      status: result.status,
      attemptedCount: result.attemptedCount,
      syncedCount: result.syncedCount,
      pendingCount: result.pendingCount,
      lastError: result.lastError,
      lastErrorCode: result.lastErrorCode,
    },
    ...current,
  ].slice(0, 20);
  await saveItem(CATALOG_SYNC_LOG_KEY, next);
}

export async function getRecentInventorySyncLogs(limit = 10) {
  const safeLimit = Math.max(1, Math.min(limit, 20));
  const logs = (await getItem<InventorySyncLogItem[]>(CATALOG_SYNC_LOG_KEY)) ?? [];
  return logs.slice(0, safeLimit);
}

export async function getCatalogSyncStatus(): Promise<CatalogSyncStatus> {
  const [pendingQueue, metadata] = await Promise.all([
    getItem<InventorySyncQueueItem[]>(CATALOG_SYNC_QUEUE_KEY),
    getCatalogSyncMetadata(),
  ]);

  return {
    pendingCount: pendingQueue?.length ?? 0,
    lastAttemptAt: metadata.lastAttemptAt,
    lastSuccessAt: metadata.lastSuccessAt,
    lastError: metadata.lastError,
    lastErrorCode: metadata.lastErrorCode,
  };
}

export async function getLastCatalogRuntimeSource(): Promise<CatalogRuntimeData["source"] | null> {
  const stored = await getItem<CatalogRuntimeData["source"]>(CATALOG_LAST_SOURCE_KEY);
  if (stored === "api" || stored === "cache" || stored === "seed") return stored;
  return null;
}

async function buildRuntimeDataFromSnapshot(
  source: CatalogRuntimeData["source"],
  snapshot: CatalogSnapshot,
  inventoryOverrides: Record<string, number>,
  localProducts: CatalogBeerRecord[] = []
): Promise<CatalogRuntimeData> {
  const mergedSnapshot = mergeCatalogSnapshotWithLocalProducts(snapshot, localProducts);
  const inventoryRecords = buildCatalogRuntimeBeerRecords(
    mergedSnapshot,
    inventoryOverrides,
    new Set(localProducts.map((beer) => beer.id))
  );
  const syncStatus = await getCatalogSyncStatus();
  await saveItem(CATALOG_LAST_SOURCE_KEY, source);
  return {
    source,
    snapshot: mergedSnapshot,
    storesData: buildStoreItems(mergedSnapshot, inventoryRecords),
    inventoryRecords,
    syncStatus,
  };
}

export async function flushInventorySyncQueue(maxBatchSize = 30): Promise<InventorySyncFlushResult> {
  const nowIso = new Date().toISOString();
  const pendingQueue = (await getItem<InventorySyncQueueItem[]>(CATALOG_SYNC_QUEUE_KEY)) ?? [];
  const normalizedBatchSize = Math.max(1, Math.min(maxBatchSize, 200));

  if (pendingQueue.length === 0) {
    const metadata = await getCatalogSyncMetadata();
    const result: InventorySyncFlushResult = {
      status: "no_pending",
      attemptedCount: 0,
      syncedCount: 0,
      pendingCount: 0,
      lastError: metadata.lastError,
      lastErrorCode: metadata.lastErrorCode,
    };
    await appendInventorySyncLog(result);
    return result;
  }

  if (!CATALOG_API_BASE_URL) {
    await saveCatalogSyncMetadata({
      lastAttemptAt: nowIso,
      lastSuccessAt: null,
      lastError: "Catalog API base URL is not configured.",
      lastErrorCode: "api_not_configured",
    });
    const result: InventorySyncFlushResult = {
      status: "unavailable",
      attemptedCount: 0,
      syncedCount: 0,
      pendingCount: pendingQueue.length,
      lastError: "Catalog API base URL is not configured.",
      lastErrorCode: "api_not_configured",
    };
    await appendInventorySyncLog(result);
    return result;
  }

  const nextBatch = pendingQueue.slice(0, normalizedBatchSize);
  const payload = {
    syncedAt: nowIso,
    updates: nextBatch.map((item) => ({
      eventId: item.id,
      beerId: item.beerId,
      availableUnits: item.availableUnits,
      reason: item.reason,
      queuedAt: item.queuedAt,
    })),
  };

  try {
    const authHeaders = await loadPersistedAuthHeaders();
    const response = await fetchWithTimeout(`${CATALOG_API_BASE_URL}${CATALOG_SYNC_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    }, CATALOG_SYNC_TIMEOUT_MS);

    if (!response.ok) {
      let payload: InventorySyncApiErrorPayload | null = null;
      try {
        payload = (await response.json()) as InventorySyncApiErrorPayload;
      } catch {
        payload = null;
      }

      const payloadCode =
        typeof payload?.code === "string" && payload.code.trim().length > 0
          ? payload.code.trim().toUpperCase()
          : null;
      const payloadMessage =
        typeof payload?.message === "string" && payload.message.trim().length > 0
          ? payload.message
          : `Catalog inventory sync returned ${response.status}`;
      const mappedCode = mapBackendCodeToSyncError(payloadCode);
      const persistedMessage = payloadCode ? `[${payloadCode}] ${payloadMessage}` : payloadMessage;

      await saveCatalogSyncMetadata({
        lastAttemptAt: nowIso,
        lastSuccessAt: null,
        lastError: persistedMessage,
        lastErrorCode: mappedCode,
      });

      const result: InventorySyncFlushResult = {
        status: "failed",
        attemptedCount: nextBatch.length,
        syncedCount: 0,
        pendingCount: pendingQueue.length,
        lastError: persistedMessage,
        lastErrorCode: mappedCode,
      };
      await appendInventorySyncLog(result);
      return result;
    }

    let syncResponse = null;
    try {
      syncResponse = extractInventorySyncResponse((await response.json()) as unknown);
    } catch {
      syncResponse = null;
    }

    if (syncResponse && (syncResponse.rejectedCount > 0 || syncResponse.acceptedCount < nextBatch.length)) {
      const persistedMessage = "Catalog inventory sync returned partial acceptance.";
      await saveCatalogSyncMetadata({
        lastAttemptAt: nowIso,
        lastSuccessAt: null,
        lastError: persistedMessage,
        lastErrorCode: "backend_rejected",
      });
      const result: InventorySyncFlushResult = {
        status: "failed",
        attemptedCount: nextBatch.length,
        syncedCount: 0,
        pendingCount: pendingQueue.length,
        lastError: persistedMessage,
        lastErrorCode: "backend_rejected",
      };
      await appendInventorySyncLog(result);
      return result;
    }

    const remainingQueue = pendingQueue.slice(nextBatch.length);
    const syncedAt = syncResponse?.syncedAt ?? nowIso;
    const cachedSnapshot = await getItem<CatalogSnapshot>(CATALOG_SNAPSHOT_KEY);
    const normalizedCachedSnapshot = cachedSnapshot ? parseCatalogSnapshot(cachedSnapshot) : null;
    const nextSnapshot = normalizedCachedSnapshot
      ? applyInventorySyncUpdatesToSnapshot(
          normalizedCachedSnapshot,
          nextBatch.map((item) => ({
            beerId: item.beerId,
            availableUnits: item.availableUnits,
          })),
          syncedAt
        )
      : null;
    await Promise.all([
      saveItem(CATALOG_SYNC_QUEUE_KEY, remainingQueue),
      saveCatalogSyncMetadata({
        lastAttemptAt: nowIso,
        lastSuccessAt: syncedAt,
        lastError: null,
        lastErrorCode: null,
      }),
      ...(nextSnapshot ? [saveItem(CATALOG_SNAPSHOT_KEY, nextSnapshot)] : []),
    ]);

    const result: InventorySyncFlushResult = {
      status: "synced",
      attemptedCount: nextBatch.length,
      syncedCount: nextBatch.length,
      pendingCount: remainingQueue.length,
      lastError: null,
      lastErrorCode: null,
    };
    await appendInventorySyncLog(result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory sync failed.";
    const lowerMessage = message.toLowerCase();
    const errorCode: CatalogSyncErrorCode = lowerMessage.includes("aborted")
      ? "network_error"
      : lowerMessage.includes("timeout")
        ? "network_error"
        : message.includes("Failed to fetch")
      ? "network_error"
      : message.includes("returned")
        ? "http_error"
        : "unknown";
    await saveCatalogSyncMetadata({
      lastAttemptAt: nowIso,
      lastSuccessAt: null,
      lastError: message,
      lastErrorCode: errorCode,
    });
    const result: InventorySyncFlushResult = {
      status: "failed",
      attemptedCount: nextBatch.length,
      syncedCount: 0,
      pendingCount: pendingQueue.length,
      lastError: message,
      lastErrorCode: errorCode,
    };
    await appendInventorySyncLog(result);
    return result;
  }
}

export async function flushInventorySyncQueueWithRetry(
  options: FlushInventoryRetryOptions = {}
): Promise<InventorySyncFlushResult> {
  const maxBatchSize = options.maxBatchSize ?? 30;
  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? CATALOG_SYNC_RETRY_ATTEMPTS, 4));
  const retryDelayMs = Math.max(200, Math.min(options.retryDelayMs ?? CATALOG_SYNC_RETRY_DELAY_MS, 5000));
  const retryMultiplier = Math.max(
    1,
    Math.min(options.retryMultiplier ?? CATALOG_SYNC_RETRY_MULTIPLIER, 3)
  );
  const maxRetryDelayMs = Math.max(
    200,
    Math.min(options.maxRetryDelayMs ?? CATALOG_SYNC_RETRY_MAX_DELAY_MS, 10000)
  );

  let latestResult: InventorySyncFlushResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    latestResult = await flushInventorySyncQueue(maxBatchSize);
    if (latestResult.status !== "failed") {
      return latestResult;
    }
    if (attempt < maxAttempts) {
      await waitFor(getRetryDelayMs(attempt, retryDelayMs, retryMultiplier, maxRetryDelayMs));
    }
  }

  return (
    latestResult ?? {
      status: "failed",
      attemptedCount: 0,
      syncedCount: 0,
      pendingCount: await getPendingInventorySyncCount(),
      lastError: "Inventory sync failed before producing a result.",
      lastErrorCode: "unknown",
    }
  );
}
