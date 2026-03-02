import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StoreItem } from "../../data/stores";
import ThemeToggle from "../../components/theme-toggle";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type StoreDetailsProps = {
  store?: StoreItem;
  onBack?: () => void;
  onRequestLogin?: () => void;
  onOpenBeer?: (beerId: string) => void;
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

export default function StoreDetails({
  store,
  onBack,
  onRequestLogin,
  onOpenBeer,
  theme,
  themeMode,
  onToggleTheme,
}: StoreDetailsProps) {
  const style = useMemo(() => createStyles(theme), [theme]);

  if (!store) {
    return (
      <View style={style.container}>
        <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />
        <View style={style.emptyState}>
          <Text style={style.emptyTitle}>Loja nao encontrada</Text>
          <TouchableOpacity style={style.backButton} onPress={onBack}>
            <Text style={style.backButtonText}>Voltar para a landing</Text>
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
          <View style={style.storeBadge}>
            <Text style={style.storeBadgeText}>{store.short}</Text>
          </View>
          <Text style={style.storeName}>{store.name}</Text>
          <Text style={style.storeTag}>{store.tag}</Text>
        </View>

        <View style={style.infoCard}>
          <Text style={style.sectionTitle}>Descricao</Text>
          <Text style={style.infoText}>{store.description}</Text>

          <Text style={style.sectionTitle}>Endereco</Text>
          <Text style={style.infoText}>{store.address}</Text>

          <Text style={style.sectionTitle}>Avaliacao</Text>
          <Text style={style.ratingText}>{store.rating.toFixed(1)} / 5.0</Text>
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionHeaderTitle}>Cervejas da loja</Text>
        </View>

        {store.beers.map((beer) => (
          <TouchableOpacity key={beer.id} style={style.beerCard} onPress={() => onOpenBeer?.(beer.id)}>
            <View style={style.beerTitleRow}>
              <Text style={style.beerName}>{beer.name}</Text>
              <Text style={style.beerPrice}>{beer.price}</Text>
            </View>
            <Text style={style.beerMeta}>{beer.style} - {beer.abv}</Text>
            <Text style={style.beerRating}>Avaliacao {beer.rating.toFixed(1)} / 5.0</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={style.loginToBuyButton} onPress={onRequestLogin}>
          <Text style={style.loginToBuyText}>Entrar para comprar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
