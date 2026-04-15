import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AppBottomNav from "../../components/app-bottom-nav";
import ThemeToggle from "../../components/theme-toggle";
import Logo from "../../assets/logo.png";
import {
  DiscoveryCampaign,
  DiscoveryHighlight,
  DiscoveryStoryStep,
  DiscoveryTargetType,
} from "../../data/discovery";
import { BeerWithStore, StoreItem, getAllBeers } from "../../data/stores";
import { CatalogRuntimeData, CatalogSyncStatus, getCatalogSyncStatus, getLastCatalogRuntimeSource } from "../../services/catalog/repository";
import { getCatalogStatusRefreshIntervalMs, shouldRefreshCatalogRuntime } from "../../services/catalog/runtime-refresh";
import { getCatalogRuntimeSourceLabel, getCatalogSyncSummary } from "../../services/catalog/status-copy";
import { UserProfile } from "../../data/users";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type Category = {
  id: string;
  label: string;
  short: string;
};

type LandingProps = {
  currentUser: UserProfile | null;
  storesData: StoreItem[];
  onHeaderAction?: () => void;
  headerActionLabel: string;
  onOpenStore?: (storeId: string) => void;
  onOpenBeer?: (beerId: string) => void;
  onOpenStoreList?: () => void;
  onOpenBeerList?: () => void;
  onOpenCatalog?: (mode: "stores" | "beers") => void;
  onOpenSearch?: () => void;
  onOpenOrders?: () => void;
  onOpenProfile?: () => void;
  highlights: DiscoveryHighlight[];
  campaigns: DiscoveryCampaign[];
  storySteps: DiscoveryStoryStep[];
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

const categories: Category[] = [
  { id: "cervejarias", label: "Cervejarias", short: "LO" },
  { id: "cervejas", label: "Cervejas", short: "CP" },
];

const LANDING_RUNTIME_REFRESH_INTERVAL_MS = getCatalogStatusRefreshIntervalMs();

export default function Landing({
  currentUser,
  storesData,
  onHeaderAction,
  headerActionLabel,
  onOpenStore,
  onOpenBeer,
  onOpenStoreList,
  onOpenBeerList,
  onOpenCatalog,
  onOpenSearch,
  onOpenOrders,
  onOpenProfile,
  highlights,
  campaigns,
  storySteps,
  theme,
  themeMode,
  onToggleTheme,
}: LandingProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const [catalogSource, setCatalogSource] = useState<CatalogRuntimeData["source"] | null>(null);
  const [catalogSyncStatus, setCatalogSyncStatus] = useState<CatalogSyncStatus | null>(null);
  const [isRuntimeRefreshing, setIsRuntimeRefreshing] = useState(false);
  const refreshInFlightRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const beerCards: BeerWithStore[] = useMemo(() => getAllBeers(storesData).slice(0, 4), [storesData]);

  async function refreshRuntimeChip() {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setIsRuntimeRefreshing(true);
    try {
      const [source, syncStatus] = await Promise.all([
        getLastCatalogRuntimeSource(),
        getCatalogSyncStatus(),
      ]);
      setCatalogSource(source);
      setCatalogSyncStatus(syncStatus);
    } catch {
      // Keep landing experience resilient when runtime metadata is unavailable.
    } finally {
      refreshInFlightRef.current = false;
      setIsRuntimeRefreshing(false);
    }
  }

  useEffect(() => {
    refreshRuntimeChip();
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (shouldRefreshCatalogRuntime(nextState)) {
        refreshRuntimeChip();
      }
    });
    const intervalId = setInterval(() => {
      if (!shouldRefreshCatalogRuntime(appStateRef.current)) return;
      refreshRuntimeChip();
    }, LANDING_RUNTIME_REFRESH_INTERVAL_MS);
    return () => {
      appStateSubscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const runtimeSourceLabel = useMemo(() => getCatalogRuntimeSourceLabel(catalogSource), [catalogSource]);
  const runtimeSummary = useMemo(
    () => getCatalogSyncSummary(catalogSyncStatus, "compact"),
    [catalogSyncStatus]
  );
  const runtimeChipText = isRuntimeRefreshing ? "Atualizando status..." : runtimeSummary.text;

  const runtimeChipStateStyle = useMemo(() => {
    if (runtimeSummary.tone === "error") return style.runtimeChipError;
    if (runtimeSummary.tone === "warning") return style.runtimeChipWarning;
    return null;
  }, [runtimeSummary.tone, style.runtimeChipError, style.runtimeChipWarning]);

  function openDiscoveryTarget(
    targetType: DiscoveryTargetType,
    options?: { targetId?: string; catalogMode?: "stores" | "beers" }
  ) {
    if (targetType === "store" && options?.targetId) {
      onOpenStore?.(options.targetId);
      return;
    }
    if (targetType === "beer" && options?.targetId) {
      onOpenBeer?.(options.targetId);
      return;
    }
    if (targetType === "catalog") {
      if (options?.catalogMode && onOpenCatalog) {
        onOpenCatalog(options.catalogMode);
        return;
      }
      if (options?.catalogMode === "stores") {
        onOpenStoreList?.();
        return;
      }
      onOpenBeerList?.();
      return;
    }
    onOpenSearch?.();
  }

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={style.contentContainer}
      >
        <View style={style.brandRow}>
          <Image source={Logo} style={style.brandLogo} resizeMode="contain" />
        </View>

        <View style={style.headerRow}>
          <Text style={style.addressText}>Entrega em Asa Sul, Brasilia</Text>
          <TouchableOpacity style={style.notificationButton} onPress={onOpenOrders}>
            <Text style={style.notificationIcon}>PED</Text>
            <View style={style.notificationBadge}>
              <Text style={style.notificationBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={style.greetingRow}>
          <Text style={style.greetingText}>
            {currentUser ? `Ola, ${currentUser.name}` : "Ola, visitante"}
          </Text>
          <TouchableOpacity style={style.loginChip} onPress={onHeaderAction}>
            <Text style={style.loginChipText}>{headerActionLabel}</Text>
          </TouchableOpacity>
        </View>

        <Text style={style.guestHelperText}>
          {currentUser
            ? currentUser.role === "buyer"
              ? "Voce ja pode comprar e acompanhar pedidos."
              : "Voce esta vendo a experiencia da sua cervejaria e do app como vendedor."
            : "Voce pode explorar tudo, mas sem finalizar compra."}
        </Text>

        <TouchableOpacity style={[style.runtimeChip, runtimeChipStateStyle]} onPress={refreshRuntimeChip}>
          <Text style={style.runtimeChipTitle}>Catalogo {runtimeSourceLabel}</Text>
          <Text style={style.runtimeChipText}>{runtimeChipText}</Text>
        </TouchableOpacity>

        <View style={style.categoriesGrid}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={style.categoryCard}
              onPress={
                item.id === "cervejarias"
                  ? () => {
                      if (onOpenCatalog) {
                        onOpenCatalog("stores");
                        return;
                      }
                      onOpenStoreList?.();
                    }
                  : () => {
                      if (onOpenCatalog) {
                        onOpenCatalog("beers");
                        return;
                      }
                      onOpenBeerList?.();
                    }
              }
            >
              <View style={style.categoryIcon}>
                <Text style={style.categoryIconText}>{item.short}</Text>
              </View>
              <Text style={style.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.bannerCard}>
          <Text style={style.bannerOverline}>entrada rapida</Text>
          <Text style={style.bannerTitle}>Seu chopp favorito no seu ritmo</Text>
          <Text style={style.bannerSubtitle}>
            Descubra rotulos artesanais, acompanhe pedidos e encontre as melhores cervejarias em poucos toques.
          </Text>
          <TouchableOpacity style={style.bannerButton} onPress={currentUser ? onOpenSearch : onHeaderAction}>
            <Text style={style.bannerButtonText}>{currentUser ? "Buscar cervejas" : "Entrar para testar"}</Text>
          </TouchableOpacity>
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Destaques de hoje</Text>
        </View>

        <View style={style.highlightList}>
          {highlights.map((highlight) => (
            <TouchableOpacity
              key={highlight.id}
              style={style.highlightCard}
              onPress={() =>
                openDiscoveryTarget(highlight.targetType, {
                  targetId: highlight.targetId,
                  catalogMode: highlight.catalogMode,
                })
              }
            >
              <Text style={style.highlightBadge}>{highlight.badge}</Text>
              <Text style={style.highlightTitle}>{highlight.title}</Text>
              <Text style={style.highlightSubtitle}>{highlight.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Campanhas</Text>
        </View>

        <View style={style.campaignList}>
          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={style.campaignCard}
              onPress={() =>
                openDiscoveryTarget(campaign.targetType, {
                  catalogMode: campaign.catalogMode,
                })
              }
            >
              <Text style={style.campaignKicker}>{campaign.kicker}</Text>
              <Text style={style.campaignTitle}>{campaign.title}</Text>
              <Text style={style.campaignDescription}>{campaign.description}</Text>
              <Text style={style.campaignAction}>{campaign.ctaLabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Como explorar</Text>
        </View>

        <View style={style.storyCard}>
          {storySteps.map((step, index) => (
            <View key={step.id} style={style.storyRow}>
              <View style={style.storyIndexBubble}>
                <Text style={style.storyIndexText}>{index + 1}</Text>
              </View>
              <View style={style.storyTextWrap}>
                <Text style={style.storyTitle}>{step.title}</Text>
                <Text style={style.storyDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Ultimas lojas</Text>
          <TouchableOpacity onPress={onOpenStoreList}>
            <Text style={style.sectionAction}>Ver mais</Text>
          </TouchableOpacity>
        </View>

        <View style={style.storeRow}>
          {storesData.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={style.storeCard}
              onPress={() => onOpenStore?.(store.id)}
            >
              <View style={style.storeLogo}>
                <Text style={style.storeLogoText}>{store.short}</Text>
              </View>
              <Text style={style.storeName}>{store.name}</Text>
              <Text style={style.storeTag}>{store.tag}</Text>
              <Text style={style.storeMeta}>Avaliacao {store.rating.toFixed(1)} / 5.0</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Ultimas cervejas</Text>
          <TouchableOpacity onPress={onOpenBeerList}>
            <Text style={style.sectionAction}>Ver mais</Text>
          </TouchableOpacity>
        </View>

        <View style={style.beersRow}>
          {beerCards.map((beer) => (
            <TouchableOpacity
              key={beer.id}
              style={style.storeCard}
              onPress={() => onOpenBeer?.(beer.id)}
            >
              <View style={style.storeLogo}>
                <Text style={style.storeLogoText}>{beer.style.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={style.storeName}>{beer.name}</Text>
              <Text style={style.storeTag}>{beer.storeName}</Text>
              <Text style={style.storeMeta}>Avaliacao {beer.rating.toFixed(1)} / 5.0</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <AppBottomNav
        theme={theme}
        activeTab="home"
        onOpenHome={() => undefined}
        onOpenSearch={onOpenSearch}
        onOpenOrders={onOpenOrders}
        onOpenProfile={onOpenProfile}
      />
    </View>
  );
}
