import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
            ? "Explore todas as cervejarias disponiveis e abra o perfil de cada uma."
            : "Veja todas as cervejas cadastradas, com avaliacao, preco e cervejaria."}
        </Text>

        {isStoresMode
          ? storesData.map((store) => (
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
          : allBeers.map((beer) => (
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
      </ScrollView>
    </View>
  );
}
