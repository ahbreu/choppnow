export type CatalogRuntimeEnv = "development" | "stage" | "production";

export const CATALOG_STATUS_REFRESH_PRESETS: Record<CatalogRuntimeEnv, number> = {
  development: 20000,
  stage: 30000,
  production: 60000,
};

export function normalizeCatalogRuntimeEnv(rawValue: string | undefined): CatalogRuntimeEnv {
  const normalized = (rawValue ?? "development").trim().toLowerCase();
  if (normalized === "production" || normalized === "prod") return "production";
  if (normalized === "stage" || normalized === "staging") return "stage";
  return "development";
}

export function getCatalogStatusRefreshIntervalMs() {
  const runtimeEnv = normalizeCatalogRuntimeEnv(
    process.env.EXPO_PUBLIC_APP_ENV ?? process.env.NODE_ENV
  );
  const preset = CATALOG_STATUS_REFRESH_PRESETS[runtimeEnv];
  const overrideRaw = process.env.EXPO_PUBLIC_CATALOG_STATUS_REFRESH_MS;
  if (!overrideRaw || overrideRaw.trim().length === 0) return preset;
  const parsed = Number(overrideRaw);
  if (!Number.isFinite(parsed)) return preset;
  return Math.max(10000, Math.min(parsed, 180000));
}

export function shouldRefreshCatalogRuntime(appState: string) {
  return appState === "active";
}
