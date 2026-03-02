import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import AppBottomNav from "../../components/app-bottom-nav";
import ThemeToggle from "../../components/theme-toggle";
import { BeerWithStore, StoreItem, getAllBeers, getBitternessLabel } from "../../data/stores";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type ContentFilter = "all" | "beers" | "stores";
type BitternessFilter = "all" | "Baixo" | "Medio" | "Alto";

type SearchProps = {
  storesData: StoreItem[];
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
  onOpenStore?: (storeId: string) => void;
  onOpenBeer?: (beerId: string) => void;
  onOpenHome?: () => void;
  onOpenOrders?: () => void;
  onOpenProfile?: () => void;
};

export default function Search({
  storesData,
  theme,
  themeMode,
  onToggleTheme,
  onOpenStore,
  onOpenBeer,
  onOpenHome,
  onOpenOrders,
  onOpenProfile,
}: SearchProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState("");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [bitternessFilter, setBitternessFilter] = useState<BitternessFilter>("all");

  const allBeers = useMemo(() => getAllBeers(storesData), [storesData]);
  const availableStyles = useMemo(
    () => ["all", ...Array.from(new Set(allBeers.map((beer) => beer.style)))],
    [allBeers]
  );

  function matchesQuery(value: string) {
    return value.toLowerCase().includes(query.trim().toLowerCase());
  }

  function matchesBeerFilters(beer: BeerWithStore) {
    const matchesText =
      query.trim().length === 0 ||
      matchesQuery(beer.name) ||
      matchesQuery(beer.style) ||
      matchesQuery(beer.storeName) ||
      matchesQuery(beer.description);
    const matchesStyle = styleFilter === "all" || beer.style === styleFilter;
    const matchesBitterness =
      bitternessFilter === "all" || getBitternessLabel(beer.ibu) === bitternessFilter;

    return matchesText && matchesStyle && matchesBitterness;
  }

  const filteredBeers = useMemo(
    () => allBeers.filter((beer) => matchesBeerFilters(beer)),
    [allBeers, query, styleFilter, bitternessFilter]
  );

  const filteredStores = useMemo(
    () =>
      storesData.filter((store) => {
        const baseTextMatch =
          query.trim().length === 0 ||
          matchesQuery(store.name) ||
          matchesQuery(store.description) ||
          matchesQuery(store.address) ||
          store.beers.some((beer) => matchesQuery(beer.name));

        const hasBeerThatMatchesExtraFilters =
          styleFilter === "all" && bitternessFilter === "all"
            ? true
            : store.beers.some((beer) => {
                const styleOk = styleFilter === "all" || beer.style === styleFilter;
                const bitternessOk =
                  bitternessFilter === "all" || getBitternessLabel(beer.ibu) === bitternessFilter;
                return styleOk && bitternessOk;
              });

        return baseTextMatch && hasBeerThatMatchesExtraFilters;
      }),
    [storesData, query, styleFilter, bitternessFilter]
  );

  const showBeers = contentFilter === "all" || contentFilter === "beers";
  const showStores = contentFilter === "all" || contentFilter === "stores";
  const hasResults =
    (showBeers && filteredBeers.length > 0) || (showStores && filteredStores.length > 0);

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        <Text style={style.title}>Busca</Text>
        <Text style={style.subtitle}>
          Encontre cervejas e cervejarias. Filtre por estilo e nivel de amargor.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome, estilo ou cervejaria"
          placeholderTextColor={theme.colors.textMuted}
          style={style.input}
        />

        <View style={style.filterSection}>
          <Text style={style.filterLabel}>Buscar em</Text>
          <View style={style.chipRow}>
            {(["all", "beers", "stores"] as ContentFilter[]).map((item) => {
              const active = contentFilter === item;
              const label =
                item === "all" ? "Tudo" : item === "beers" ? "Cervejas" : "Cervejarias";
              return (
                <TouchableOpacity
                  key={item}
                  style={[style.chip, active ? style.chipActive : null]}
                  onPress={() => setContentFilter(item)}
                >
                  <Text style={[style.chipText, active ? style.chipTextActive : null]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={style.filterSection}>
          <Text style={style.filterLabel}>Tipo de cerveja</Text>
          <View style={style.chipRow}>
            {availableStyles.map((item) => {
              const active = styleFilter === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[style.chip, active ? style.chipActive : null]}
                  onPress={() => setStyleFilter(item)}
                >
                  <Text style={[style.chipText, active ? style.chipTextActive : null]}>
                    {item === "all" ? "Todos" : item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={style.filterSection}>
          <Text style={style.filterLabel}>Amargor (IBU)</Text>
          <View style={style.chipRow}>
            {(["all", "Baixo", "Medio", "Alto"] as BitternessFilter[]).map((item) => {
              const active = bitternessFilter === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[style.chip, active ? style.chipActive : null]}
                  onPress={() => setBitternessFilter(item)}
                >
                  <Text style={[style.chipText, active ? style.chipTextActive : null]}>
                    {item === "all" ? "Todos" : item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!hasResults ? (
          <View style={style.emptyBox}>
            <Text style={style.emptyText}>
              Nenhum resultado encontrado com os filtros atuais. Tente limpar a busca ou mudar o estilo.
            </Text>
          </View>
        ) : null}

        {showBeers && filteredBeers.length > 0 ? (
          <>
            <Text style={style.sectionTitle}>Cervejas</Text>
            {filteredBeers.map((beer) => (
              <TouchableOpacity key={beer.id} style={style.card} onPress={() => onOpenBeer?.(beer.id)}>
                <View style={style.badge}>
                  <Text style={style.badgeText}>{beer.style.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={style.cardTitle}>{beer.name}</Text>
                <Text style={style.cardMeta}>
                  {beer.style} - {beer.price} - IBU {beer.ibu}
                </Text>
                <Text style={style.cardText}>
                  {beer.storeName} - Avaliacao {beer.rating.toFixed(1)} / 5.0
                </Text>
                <Text style={style.cardText}>{beer.description}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {showStores && filteredStores.length > 0 ? (
          <>
            <Text style={style.sectionTitle}>Cervejarias</Text>
            {filteredStores.map((store) => (
              <TouchableOpacity key={store.id} style={style.card} onPress={() => onOpenStore?.(store.id)}>
                <View style={style.badge}>
                  <Text style={style.badgeText}>{store.short}</Text>
                </View>
                <Text style={style.cardTitle}>{store.name}</Text>
                <Text style={style.cardMeta}>Avaliacao {store.rating.toFixed(1)} / 5.0</Text>
                <Text style={style.cardText}>{store.description}</Text>
                <Text style={style.cardText}>{store.address}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>

      <AppBottomNav
        theme={theme}
        activeTab="search"
        onOpenHome={onOpenHome}
        onOpenSearch={() => undefined}
        onOpenOrders={onOpenOrders}
        onOpenProfile={onOpenProfile}
      />
    </View>
  );
}
