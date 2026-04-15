import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import { SelectedAddOn, addOnOptions, formatCurrency, parsePriceToNumber } from "../../data/commerce";
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
  onAddToCart?: (beerId: string, quantity: number, addOns: SelectedAddOn[]) => void;
  onQuickAddUpsell?: (beerId: string) => void;
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
  onQuickAddUpsell,
  upsellBeers = [],
  cartItemsCount = 0,
  theme,
  themeMode,
  onToggleTheme,
}: BeerDetailsProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const [quantity, setQuantity] = useState(1);
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setQuantity(1);
    setAddOnQuantities({});
  }, [beer?.id]);

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

  const selectedAddOns: SelectedAddOn[] = addOnOptions
    .map((option) => ({
      id: option.id,
      label: option.label,
      price: option.price,
      quantity: addOnQuantities[option.id] ?? 0,
    }))
    .filter((addOn) => addOn.quantity > 0);
  const selectedAddOnsTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + addOn.price * addOn.quantity,
    0
  );
  const basePrice = parsePriceToNumber(beer.price);
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

  function updateAddOnQuantity(addOnId: string, delta: number) {
    setAddOnQuantities((prev) => {
      const currentQuantity = prev[addOnId] ?? 0;
      const nextQuantity = Math.max(0, currentQuantity + delta);
      if (nextQuantity === 0) {
        const { [addOnId]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [addOnId]: nextQuantity,
      };
    });
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
              const addOnQuantity = addOnQuantities[addOn.id] ?? 0;
              const isSelected = addOnQuantity > 0;
              return (
                <View key={addOn.id} style={[style.addOnCard, isSelected ? style.addOnCardSelected : null]}>
                  <View style={style.addOnTopRow}>
                    <Text style={style.addOnLabel}>{addOn.label}</Text>
                    <Text style={style.addOnPrice}>{formatCurrency(addOn.price)}</Text>
                  </View>
                  <Text style={style.addOnDescription}>{addOn.description}</Text>
                  <View style={style.addOnControlRow}>
                    <TouchableOpacity
                      style={style.quantityButton}
                      onPress={() => updateAddOnQuantity(addOn.id, -1)}
                    >
                      <Text style={style.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={style.addOnQuantityValue}>{addOnQuantity}</Text>
                    <TouchableOpacity
                      style={style.quantityButton}
                      onPress={() => updateAddOnQuantity(addOn.id, 1)}
                    >
                      <Text style={style.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
              <View key={upsell.id} style={style.upsellCard}>
                <TouchableOpacity onPress={() => onOpenBeer?.(upsell.id)}>
                  <View style={style.upsellRow}>
                    <Text style={style.upsellName}>{upsell.name}</Text>
                    <Text style={style.upsellPrice}>{upsell.price}</Text>
                  </View>
                  <Text style={style.upsellMeta}>{upsell.style} - Avaliacao {upsell.rating.toFixed(1)}</Text>
                </TouchableOpacity>
                {isBuyer ? (
                  <TouchableOpacity style={style.upsellAddButton} onPress={() => onQuickAddUpsell?.(upsell.id)}>
                    <Text style={style.upsellAddButtonText}>Adicionar 1x</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
