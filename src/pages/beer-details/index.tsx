import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import { AddOnOption, addOnOptions, formatCurrency } from "../../data/commerce";
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
  onOpenBeer?: (beerId: string) => void;
  onOpenCart?: () => void;
  onAddToCart?: (beerId: string, quantity: number, addOns: AddOnOption[]) => void;
  upsellBeers?: BeerWithStore[];
  cartItemsCount?: number;
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
  onOpenBeer,
  onOpenCart,
  onAddToCart,
  upsellBeers = [],
  cartItemsCount = 0,
  theme,
  themeMode,
  onToggleTheme,
}: BeerDetailsProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

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

  const selectedAddOns = addOnOptions.filter((option) => selectedAddOnIds.includes(option.id));
  const selectedAddOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const basePrice = Number(beer.price.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
  const previewTotal = (basePrice + selectedAddOnsTotal) * quantity;
  const isBuyer = currentUser?.role === "buyer";

  const primaryLabel = !currentUser
    ? "Entrar para comprar"
    : isBuyer
      ? "Adicionar ao carrinho"
      : "Ver cervejaria";

  const primaryAction = !currentUser
    ? onRequestLogin
    : isBuyer
      ? () => onAddToCart?.(beer.id, quantity, selectedAddOns)
      : () => onOpenStore?.(beer.storeId);

  function toggleAddOn(addOnId: string) {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
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
            <Text style={style.topActionText}>Conta</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={style.cartAction} onPress={onOpenCart}>
          <Text style={style.cartActionText}>Carrinho ({cartItemsCount})</Text>
        </TouchableOpacity>

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

        {isBuyer ? (
          <View style={style.infoCard}>
            <Text style={style.sectionTitle}>Quantidade</Text>
            <View style={style.quantityRow}>
              <TouchableOpacity style={style.quantityButton} onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                <Text style={style.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={style.quantityValue}>{quantity}</Text>
              <TouchableOpacity style={style.quantityButton} onPress={() => setQuantity((prev) => prev + 1)}>
                <Text style={style.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={style.sectionTitle}>Add-ons</Text>
            {addOnOptions.map((addOn) => {
              const isSelected = selectedAddOnIds.includes(addOn.id);
              return (
                <TouchableOpacity
                  key={addOn.id}
                  style={[style.addOnCard, isSelected ? style.addOnCardSelected : null]}
                  onPress={() => toggleAddOn(addOn.id)}
                >
                  <View style={style.addOnTopRow}>
                    <Text style={style.addOnLabel}>{addOn.label}</Text>
                    <Text style={style.addOnPrice}>{formatCurrency(addOn.price)}</Text>
                  </View>
                  <Text style={style.addOnDescription}>{addOn.description}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={style.previewTotalRow}>
              <Text style={style.previewTotalLabel}>Subtotal parcial</Text>
              <Text style={style.previewTotalValue}>{formatCurrency(previewTotal)}</Text>
            </View>
          </View>
        ) : null}

        {upsellBeers.length > 0 ? (
          <View style={style.infoCard}>
            <Text style={style.sectionTitle}>Combine com</Text>
            {upsellBeers.map((upsell) => (
              <TouchableOpacity key={upsell.id} style={style.upsellCard} onPress={() => onOpenBeer?.(upsell.id)}>
                <View style={style.upsellRow}>
                  <Text style={style.upsellName}>{upsell.name}</Text>
                  <Text style={style.upsellPrice}>{upsell.price}</Text>
                </View>
                <Text style={style.upsellMeta}>{upsell.style} - Avaliacao {upsell.rating.toFixed(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={style.primaryButton} onPress={primaryAction}>
          <Text style={style.primaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
