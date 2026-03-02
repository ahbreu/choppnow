import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BeerWithStore } from "../../data/stores";
import ThemeToggle from "../../components/theme-toggle";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type BeerDetailsProps = {
  beer?: BeerWithStore;
  onBack?: () => void;
  onRequestLogin?: () => void;
  onOpenStore?: (storeId: string) => void;
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

export default function BeerDetails({
  beer,
  onBack,
  onRequestLogin,
  onOpenStore,
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

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        <View style={style.topRow}>
          <TouchableOpacity style={style.topAction} onPress={onBack}>
            <Text style={style.topActionText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={style.topAction} onPress={onRequestLogin}>
            <Text style={style.topActionText}>Entrar</Text>
          </TouchableOpacity>
        </View>

        <View style={style.headerCard}>
          <View style={style.badge}>
            <Text style={style.badgeText}>{beer.style.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={style.beerName}>{beer.name}</Text>
          <Text style={style.beerMeta}>{beer.style} - {beer.abv}</Text>
          <Text style={style.beerPrice}>{beer.price}</Text>
        </View>

        <View style={style.infoCard}>
          <Text style={style.sectionTitle}>Descricao</Text>
          <Text style={style.infoText}>{beer.description}</Text>

          <Text style={style.sectionTitle}>Avaliacao</Text>
          <Text style={style.ratingText}>{beer.rating.toFixed(1)} / 5.0</Text>

          <Text style={style.sectionTitle}>Cervejaria</Text>
          <TouchableOpacity onPress={() => onOpenStore?.(beer.storeId)}>
            <Text style={style.linkText}>{beer.storeName}</Text>
          </TouchableOpacity>
          <Text style={style.infoText}>{beer.storeAddress}</Text>
        </View>

        <TouchableOpacity style={style.primaryButton} onPress={() => onOpenStore?.(beer.storeId)}>
          <Text style={style.primaryButtonText}>Ver cervejaria</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
