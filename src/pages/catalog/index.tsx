import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  catalogFilterPresets,
  homeCampaigns,
} from "../../data/discovery";
import ThemeToggle from "../../components/theme-toggle";
import { StoreItem, getAllBeers } from "../../data/stores";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

export type CatalogMode = "stores" | "beers";

type CatalogProps = {
  mode: CatalogMode;
  storesData: StoreItem[];
  onBack?: () => void;
  onOpenStore?: (storeId: string) => void;
  onOpenBeer?: (beerId: string) => void;
  onRequestLogin?: () => void;
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

export default function Catalog({
  mode,
  storesData,
  onBack,
  onOpenStore,
  onOpenBeer,
  onRequestLogin,
  theme,
  themeMode,
  onToggleTheme,
}: CatalogProps) {
  const allBeers = useMemo(() => getAllBeers(storesData), [storesData]);
  const isStoresMode = mode === "stores";
  const style = useMemo(() => createStyles(theme), [theme]);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);

  const availableFilters = useMemo(
    () => catalogFilterPresets.filter((item) => item.mode === mode),
    [mode]
  );

  const selectedFilter = useMemo(
    () => availableFilters.find((item) => item.id === selectedFilterId),
    [availableFilters, selectedFilterId]
  );

  const visibleStores = useMemo(() => {
    if (!selectedFilter?.criteria) return storesData;
    const { minRating, addressIncludes, tagIncludes } = selectedFilter.criteria;
    return storesData.filter((store) => {
      if (minRating && store.rating < minRating) return false;
      if (addressIncludes?.length) {
        const matchedAddress = addressIncludes.some((value) =>
          store.address.toLowerCase().includes(value.toLowerCase())
        );
        if (!matchedAddress) return false;
      }
      if (tagIncludes?.length) {
        const matchedTag = tagIncludes.some((value) =>
          store.tag.toLowerCase().includes(value.toLowerCase())
        );
        if (!matchedTag) return false;
      }
      return true;
    });
  }, [selectedFilter, storesData]);

  const visibleBeers = useMemo(() => {
    if (!selectedFilter?.criteria) return allBeers;
    const { minRating, minIbu, maxIbu, maxPrice, styles } = selectedFilter.criteria;
    return allBeers.filter((beer) => {
      if (minRating && beer.rating < minRating) return false;
      if (typeof minIbu === "number" && beer.ibu < minIbu) return false;
      if (typeof maxIbu === "number" && beer.ibu > maxIbu) return false;
      if (typeof maxPrice === "number") {
        const parsedPrice = Number(beer.price.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        if (parsedPrice > maxPrice) return false;
      }
      if (styles?.length) {
        const normalizedStyle = beer.style.toLowerCase();
        const hasStyle = styles.some((styleName) => normalizedStyle.includes(styleName.toLowerCase()));
        if (!hasStyle) return false;
      }
      return true;
    });
  }, [allBeers, selectedFilter]);

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        <View style={style.topRow}>
          <TouchableOpacity style={style.topAction} onPress={onBack}>
            <Text style={style.topActionText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={style.topAction} onPress={onRequestLogin}>
            <Text style={style.topActionText}>Conta</Text>
          </TouchableOpacity>
        </View>

        <Text style={style.pageTitle}>{isStoresMode ? "Todas as cervejarias" : "Todas as cervejas"}</Text>
        <Text style={style.pageSubtitle}>
          {isStoresMode
            ? "Colecoes de cervejarias com filtros por bairro, nota e campanha."
            : "Catalogo vivo com rotulos por estilo, amargor, faixa de preco e nota."}
        </Text>

        <View style={style.filterRail}>
          <TouchableOpacity
            style={[style.filterChip, selectedFilterId === null && style.filterChipActive]}
            onPress={() => setSelectedFilterId(null)}
          >
            <Text style={[style.filterChipText, selectedFilterId === null && style.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {availableFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[style.filterChip, selectedFilterId === filter.id && style.filterChipActive]}
              onPress={() =>
                setSelectedFilterId((prev) => (prev === filter.id ? null : filter.id))
              }
            >
              <Text
                style={[
                  style.filterChipText,
                  selectedFilterId === filter.id && style.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.storylineCard}>
          <Text style={style.storylineTitle}>Storytelling da colecao</Text>
          <Text style={style.storylineText}>
            {selectedFilter
              ? selectedFilter.description
              : "Selecione uma colecao para reduzir o catalogo e acelerar a descoberta."}
          </Text>
        </View>

        <View style={style.campaignStrip}>
          {homeCampaigns.slice(0, 2).map((campaign) => (
            <View key={campaign.id} style={style.campaignTag}>
              <Text style={style.campaignTagTitle}>{campaign.title}</Text>
            </View>
          ))}
        </View>

        {isStoresMode
          ? visibleStores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={style.card}
                onPress={() => onOpenStore?.(store.id)}
              >
                <View style={style.badge}>
                  <Text style={style.badgeText}>{store.short}</Text>
                </View>
                <Text style={style.cardTitle}>{store.name}</Text>
                <Text style={style.cardMeta}>Avaliacao {store.rating.toFixed(1)} / 5.0</Text>
                <Text style={style.cardDescription} numberOfLines={2}>
                  {store.description}
                </Text>
                <Text style={style.cardFoot}>{store.address}</Text>
              </TouchableOpacity>
            ))
          : visibleBeers.map((beer) => (
              <TouchableOpacity
                key={beer.id}
                style={style.card}
                onPress={() => onOpenBeer?.(beer.id)}
              >
                <View style={style.badge}>
                  <Text style={style.badgeText}>{beer.style.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={style.cardTitle}>{beer.name}</Text>
                <Text style={style.cardMeta}>
                  {beer.style} - {beer.abv} - {beer.price}
                </Text>
                <Text style={style.cardDescription} numberOfLines={2}>
                  {beer.description}
                </Text>
                <Text style={style.cardFoot}>
                  Cervejaria {beer.storeName} - Avaliacao {beer.rating.toFixed(1)}
                </Text>
              </TouchableOpacity>
            ))}

        {(isStoresMode ? visibleStores.length : visibleBeers.length) === 0 ? (
          <View style={style.emptyState}>
            <Text style={style.emptyTitle}>Nenhum resultado nesta colecao</Text>
            <Text style={style.emptySubtitle}>Troque o filtro para ver mais opcoes.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
