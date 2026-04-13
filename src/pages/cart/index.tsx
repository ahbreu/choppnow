import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import { CartState, formatCurrency, getCartItemLineTotal, getCartSubtotal } from "../../data/commerce";
import { UserProfile } from "../../data/users";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type CartProps = {
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
  currentUser: UserProfile | null;
  cart: CartState;
  onBack?: () => void;
  onRequestLogin?: () => void;
  onIncreaseQuantity?: (itemId: string) => void;
  onDecreaseQuantity?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onClearCart?: () => void;
  onProceedCheckout?: () => void;
};

export default function Cart({
  theme,
  themeMode,
  onToggleTheme,
  currentUser,
  cart,
  onBack,
  onRequestLogin,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onClearCart,
  onProceedCheckout,
}: CartProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const subtotal = getCartSubtotal(cart);
  const deliveryFee = cart.items.length > 0 ? 7.9 : 0;
  const serviceFee = cart.items.length > 0 ? 2.5 : 0;
  const total = subtotal + deliveryFee + serviceFee;

  const isBuyer = currentUser?.role === "buyer";

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        <View style={style.topRow}>
          <TouchableOpacity style={style.topAction} onPress={onBack}>
            <Text style={style.topActionText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={style.topAction} onPress={onClearCart}>
            <Text style={style.topActionText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <Text style={style.title}>Carrinho</Text>
        <Text style={style.subtitle}>
          {cart.storeName ? `Itens da loja ${cart.storeName}` : "Seu carrinho ainda esta vazio."}
        </Text>

        {!isBuyer ? (
          <View style={style.emptyCard}>
            <Text style={style.emptyText}>
              Voce precisa entrar com uma conta de comprador para usar carrinho e checkout.
            </Text>
            <TouchableOpacity style={style.ctaButton} onPress={onRequestLogin}>
              <Text style={style.ctaButtonText}>Ir para login</Text>
            </TouchableOpacity>
          </View>
        ) : cart.items.length === 0 ? (
          <View style={style.emptyCard}>
            <Text style={style.emptyText}>Adicione cervejas com add-ons para iniciar o pedido.</Text>
          </View>
        ) : (
          <>
            {cart.items.map((item) => (
              <View key={item.id} style={style.itemCard}>
                <View style={style.itemTopRow}>
                  <View style={style.itemInfo}>
                    <Text style={style.itemName}>{item.beerName}</Text>
                    <Text style={style.itemMeta}>{item.beerStyle}</Text>
                  </View>
                  <Text style={style.itemPrice}>{formatCurrency(getCartItemLineTotal(item))}</Text>
                </View>

                {item.addOns.length > 0 ? (
                  <View style={style.addOnList}>
                    {item.addOns.map((addOn) => (
                      <Text key={`${item.id}-${addOn.id}`} style={style.addOnText}>
                        + {addOn.quantity}x {addOn.label} ({formatCurrency(addOn.price)})
                      </Text>
                    ))}
                  </View>
                ) : null}

                <View style={style.itemActionsRow}>
                  <View style={style.quantityStepper}>
                    <TouchableOpacity style={style.stepperButton} onPress={() => onDecreaseQuantity?.(item.id)}>
                      <Text style={style.stepperButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={style.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity style={style.stepperButton} onPress={() => onIncreaseQuantity?.(item.id)}>
                      <Text style={style.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => onRemoveItem?.(item.id)}>
                    <Text style={style.removeText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={style.summaryCard}>
              <View style={style.summaryRow}>
                <Text style={style.summaryLabel}>Subtotal</Text>
                <Text style={style.summaryValue}>{formatCurrency(subtotal)}</Text>
              </View>
              <View style={style.summaryRow}>
                <Text style={style.summaryLabel}>Entrega</Text>
                <Text style={style.summaryValue}>{formatCurrency(deliveryFee)}</Text>
              </View>
              <View style={style.summaryRow}>
                <Text style={style.summaryLabel}>Taxa de servico</Text>
                <Text style={style.summaryValue}>{formatCurrency(serviceFee)}</Text>
              </View>
              <View style={style.summaryRow}>
                <Text style={style.summaryTotalLabel}>Total</Text>
                <Text style={style.summaryTotalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>

            <TouchableOpacity style={style.ctaButton} onPress={onProceedCheckout}>
              <Text style={style.ctaButtonText}>Ir para checkout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
