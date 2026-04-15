import { useCallback, useEffect, useState } from "react";
import {
  CatalogFilterPreset,
  DiscoveryCampaign,
  DiscoveryHighlight,
  DiscoveryStoryStep,
  catalogFilterPresets,
  discoveryStorySteps,
  homeCampaigns,
  homeHighlights,
} from "../data/discovery";
import { initialStores, StoreItem } from "../data/stores";
import { CatalogBeerRuntimeRecord } from "../services/catalog/local-products";
import { CatalogRuntimeData, CatalogStoreRecord, loadCatalogRuntimeData } from "../services/catalog/repository";

const initialCatalogStores: CatalogStoreRecord[] = initialStores.map((store) => ({
  id: store.id,
  name: store.name,
  tag: store.tag,
  short: store.short,
  description: store.description,
  address: store.address,
  rating: store.rating,
}));

function applyRuntimeCatalogState(
  runtimeCatalog: CatalogRuntimeData,
  setters: {
    setStoresData: (value: StoreItem[]) => void;
    setCatalogStores: (value: CatalogStoreRecord[]) => void;
    setCatalogInventoryRecords: (value: CatalogBeerRuntimeRecord[]) => void;
    setDiscoveryHighlights: (value: DiscoveryHighlight[]) => void;
    setDiscoveryCampaigns: (value: DiscoveryCampaign[]) => void;
    setDiscoveryStory: (value: DiscoveryStoryStep[]) => void;
    setCatalogFilters: (value: CatalogFilterPreset[]) => void;
  }
) {
  setters.setStoresData(runtimeCatalog.storesData);
  setters.setCatalogStores(runtimeCatalog.snapshot.stores);
  setters.setCatalogInventoryRecords(runtimeCatalog.inventoryRecords);
  setters.setDiscoveryHighlights(runtimeCatalog.snapshot.discovery.highlights);
  setters.setDiscoveryCampaigns(runtimeCatalog.snapshot.discovery.campaigns);
  setters.setDiscoveryStory(runtimeCatalog.snapshot.discovery.storySteps);
  setters.setCatalogFilters(runtimeCatalog.snapshot.discovery.filters);
}

export function useCatalogRuntime() {
  const [storesData, setStoresData] = useState<StoreItem[]>(initialStores);
  const [catalogStores, setCatalogStores] = useState<CatalogStoreRecord[]>(initialCatalogStores);
  const [catalogInventoryRecords, setCatalogInventoryRecords] = useState<CatalogBeerRuntimeRecord[]>([]);
  const [discoveryHighlights, setDiscoveryHighlights] = useState<DiscoveryHighlight[]>(homeHighlights);
  const [discoveryCampaigns, setDiscoveryCampaigns] = useState<DiscoveryCampaign[]>(homeCampaigns);
  const [discoveryStory, setDiscoveryStory] = useState<DiscoveryStoryStep[]>(discoveryStorySteps);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilterPreset[]>(catalogFilterPresets);

  const applyRuntimeCatalog = useCallback((runtimeCatalog: CatalogRuntimeData) => {
    applyRuntimeCatalogState(runtimeCatalog, {
      setStoresData,
      setCatalogStores,
      setCatalogInventoryRecords,
      setDiscoveryHighlights,
      setDiscoveryCampaigns,
      setDiscoveryStory,
      setCatalogFilters,
    });
  }, []);

  const refreshCatalogRuntime = useCallback(async () => {
    const runtimeCatalog = await loadCatalogRuntimeData();
    applyRuntimeCatalog(runtimeCatalog);
    return runtimeCatalog;
  }, [applyRuntimeCatalog]);

  useEffect(() => {
    let mounted = true;

    loadCatalogRuntimeData()
      .then((runtimeCatalog) => {
        if (!mounted) return;
        applyRuntimeCatalog(runtimeCatalog);
      })
      .catch(() => {
        // App remains functional with seeded in-memory state.
      });

    return () => {
      mounted = false;
    };
  }, [applyRuntimeCatalog]);

  return {
    storesData,
    catalogStores,
    catalogInventoryRecords,
    discoveryHighlights,
    discoveryCampaigns,
    discoveryStory,
    catalogFilters,
    applyRuntimeCatalog,
    refreshCatalogRuntime,
  };
}
