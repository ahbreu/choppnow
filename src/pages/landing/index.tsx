import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import AppBottomNav from "../../components/app-bottom-nav";
import ThemeToggle from "../../components/theme-toggle";
import { BeerWithStore, StoreItem, getAllBeers } from "../../data/stores";
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
  onOpenSearch?: () => void;
  onOpenOrders?: () => void;
  onOpenProfile?: () => void;
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

const categories: Category[] = [
  { id: "cervejarias", label: "Cervejarias", short: "CV" },
  { id: "cervejas", label: "Cervejas", short: "CJ" },
];

export default function Landing({
  currentUser,
  storesData,
  onHeaderAction,
  headerActionLabel,
  onOpenStore,
  onOpenBeer,
  onOpenStoreList,
  onOpenBeerList,
  onOpenSearch,
  onOpenOrders,
  onOpenProfile,
  theme,
  themeMode,
  onToggleTheme,
}: LandingProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const beerCards: BeerWithStore[] = useMemo(() => getAllBeers(storesData).slice(0, 4), [storesData]);

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={style.contentContainer}
      >
        <View style={style.headerRow}>
          <Text style={style.addressText}>Entrega em Asa Sul, Brasilia</Text>
          <TouchableOpacity style={style.notificationButton} onPress={onOpenOrders}>
            <Text style={style.notificationIcon}>NL</Text>
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

        <View style={style.categoriesGrid}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={style.categoryCard}
              onPress={item.id === "cervejarias" ? onOpenStoreList : onOpenBeerList}
            >
              <View style={style.categoryIcon}>
                <Text style={style.categoryIconText}>{item.short}</Text>
              </View>
              <Text style={style.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.bannerCard}>
          <Text style={style.bannerOverline}>choppnow</Text>
          <Text style={style.bannerTitle}>Explore, compre e gerencie cervejas artesanais em um so app</Text>
          <Text style={style.bannerSubtitle}>
            Busca com filtros, compras mockadas, acompanhamento de pedidos e perfil de vendedor para publicar produtos.
          </Text>
          <TouchableOpacity style={style.bannerButton} onPress={currentUser ? onOpenSearch : onHeaderAction}>
            <Text style={style.bannerButtonText}>{currentUser ? "Buscar cervejas" : "Entrar para testar"}</Text>
          </TouchableOpacity>
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
