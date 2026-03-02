import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import { BeerWithStore, getBitternessLabel } from "../../data/stores";
import { UserProfile } from "../../data/users";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type BeerDetailsProps = {
  beer?: BeerWithStore;
  currentUser: UserProfile | null;
  onBack?: () => void;
  onRequestLogin?: () => void;
  onOpenStore?: (storeId: string) => void;
  onBuyBeer?: (beerId: string) => void;
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

export default function BeerDetails({
  beer,
  currentUser,
  onBack,
  onRequestLogin,
  onOpenStore,
  onBuyBeer,
  theme,
  themeMode,
  onToggleTheme,
}: BeerDetailsProps) {
  const style = useMemo(() => createStyles(theme), [theme]);

  if (!beer) {
    return (
      <View style={style.container}>
        <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />
        <View style={style.emptyState}>
          <Text style={style.emptyTitle}>Cerveja nao encontrada</Text>
          <TouchableOpacity style={style.emptyButton} onPress={onBack}>
            <Text style={style.emptyButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const primaryLabel = !currentUser
    ? "Entrar para comprar"
    : currentUser.role === "buyer"
      ? "Comprar agora"
      : "Ver cervejaria";

  const primaryAction = !currentUser
    ? onRequestLogin
    : currentUser.role === "buyer"
      ? () => onBuyBeer?.(beer.id)
      : () => onOpenStore?.(beer.storeId);

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

        <View style={style.headerCard}>
          <View style={style.badge}>
            <Text style={style.badgeText}>{beer.style.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={style.beerName}>{beer.name}</Text>
          <Text style={style.beerMeta}>{beer.style} - {beer.abv} - IBU {beer.ibu}</Text>
          <Text style={style.beerPrice}>{beer.price}</Text>
        </View>

        <View style={style.infoCard}>
          <Text style={style.sectionTitle}>Descricao</Text>
          <Text style={style.infoText}>{beer.description}</Text>

          <Text style={style.sectionTitle}>Avaliacao</Text>
          <Text style={style.ratingText}>{beer.rating.toFixed(1)} / 5.0</Text>

          <Text style={style.sectionTitle}>Amargor</Text>
          <Text style={style.infoText}>{getBitternessLabel(beer.ibu)} (IBU {beer.ibu})</Text>

          <Text style={style.sectionTitle}>Cervejaria</Text>
          <TouchableOpacity onPress={() => onOpenStore?.(beer.storeId)}>
            <Text style={style.linkText}>{beer.storeName}</Text>
          </TouchableOpacity>
          <Text style={style.infoText}>{beer.storeAddress}</Text>
        </View>

        <TouchableOpacity style={style.primaryButton} onPress={primaryAction}>
          <Text style={style.primaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
