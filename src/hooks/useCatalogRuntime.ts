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
import { CatalogRuntimeData, loadCatalogRuntimeData } from "../services/catalog/repository";

function applyRuntimeCatalogState(
  runtimeCatalog: CatalogRuntimeData,
  setters: {
    setStoresData: (value: StoreItem[]) => void;
    setDiscoveryHighlights: (value: DiscoveryHighlight[]) => void;
    setDiscoveryCampaigns: (value: DiscoveryCampaign[]) => void;
    setDiscoveryStory: (value: DiscoveryStoryStep[]) => void;
    setCatalogFilters: (value: CatalogFilterPreset[]) => void;
  }
) {
  setters.setStoresData(runtimeCatalog.storesData);
  setters.setDiscoveryHighlights(runtimeCatalog.snapshot.discovery.highlights);
  setters.setDiscoveryCampaigns(runtimeCatalog.snapshot.discovery.campaigns);
  setters.setDiscoveryStory(runtimeCatalog.snapshot.discovery.storySteps);
  setters.setCatalogFilters(runtimeCatalog.snapshot.discovery.filters);
}

export function useCatalogRuntime() {
  const [storesData, setStoresData] = useState<StoreItem[]>(initialStores);
  const [discoveryHighlights, setDiscoveryHighlights] = useState<DiscoveryHighlight[]>(homeHighlights);
  const [discoveryCampaigns, setDiscoveryCampaigns] = useState<DiscoveryCampaign[]>(homeCampaigns);
  const [discoveryStory, setDiscoveryStory] = useState<DiscoveryStoryStep[]>(discoveryStorySteps);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilterPreset[]>(catalogFilterPresets);

  const applyRuntimeCatalog = useCallback((runtimeCatalog: CatalogRuntimeData) => {
    applyRuntimeCatalogState(runtimeCatalog, {
      setStoresData,
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
    setStoresData,
    discoveryHighlights,
    discoveryCampaigns,
    discoveryStory,
    catalogFilters,
    applyRuntimeCatalog,
    refreshCatalogRuntime,
  };
}
