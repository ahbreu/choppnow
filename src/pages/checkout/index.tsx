import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import { CartState, CheckoutDraft, formatCurrency, getCartSubtotal } from "../../data/commerce";
import { UserProfile } from "../../data/users";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type CheckoutProps = {
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
  currentUser: UserProfile | null;
  cart: CartState;
  onBack?: () => void;
  onRequestLogin?: () => void;
  onPlaceOrder?: (draft: CheckoutDraft) => void;
};

export default function Checkout({
  theme,
  themeMode,
  onToggleTheme,
  currentUser,
  cart,
  onBack,
  onRequestLogin,
  onPlaceOrder,
}: CheckoutProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutDraft["paymentMethod"]>("pix");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const subtotal = getCartSubtotal(cart);
  const deliveryFee = cart.items.length > 0 ? 7.9 : 0;
  const serviceFee = cart.items.length > 0 ? 2.5 : 0;
  const total = subtotal + deliveryFee + serviceFee;
  const isBuyer = currentUser?.role === "buyer";

  function handleConfirmOrder() {
    onPlaceOrder?.({
      paymentMethod,
      deliveryNotes: deliveryNotes.trim(),
      couponCode: couponCode.trim(),
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
        </View>

        <Text style={style.title}>Checkout</Text>
        <Text style={style.subtitle}>Finalize seu pedido com dados locais de teste.</Text>

        {!isBuyer ? (
          <View style={style.emptyCard}>
            <Text style={style.emptyText}>Entre com perfil de comprador para concluir pedidos.</Text>
            <TouchableOpacity style={style.ctaButton} onPress={onRequestLogin}>
              <Text style={style.ctaButtonText}>Ir para login</Text>
            </TouchableOpacity>
          </View>
        ) : cart.items.length === 0 ? (
          <View style={style.emptyCard}>
            <Text style={style.emptyText}>Seu carrinho esta vazio. Volte e adicione itens.</Text>
          </View>
        ) : (
          <>
            <View style={style.blockCard}>
              <Text style={style.blockTitle}>Entrega</Text>
              <Text style={style.blockText}>Endereco de entrega (placeholder):</Text>
              <Text style={style.blockStrong}>SQN 408, Bloco H, apto 302 - Brasilia, DF</Text>
              <TextInput
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                placeholder="Referencia (opcional)"
                placeholderTextColor={theme.colors.textMuted}
                style={style.input}
              />
            </View>

            <View style={style.blockCard}>
              <Text style={style.blockTitle}>Pagamento</Text>
              <View style={style.paymentRow}>
                <TouchableOpacity
                  style={[style.paymentChip, paymentMethod === "pix" ? style.paymentChipActive : null]}
                  onPress={() => setPaymentMethod("pix")}
                >
                  <Text
                    style={[
                      style.paymentChipText,
                      paymentMethod === "pix" ? style.paymentChipTextActive : null,
                    ]}
                  >
                    Pix
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[style.paymentChip, paymentMethod === "card" ? style.paymentChipActive : null]}
                  onPress={() => setPaymentMethod("card")}
                >
                  <Text
                    style={[
                      style.paymentChipText,
                      paymentMethod === "card" ? style.paymentChipTextActive : null,
                    ]}
                  >
                    Cartao
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Cupom (placeholder)"
                placeholderTextColor={theme.colors.textMuted}
                style={style.input}
              />
            </View>

            <View style={style.blockCard}>
              <Text style={style.blockTitle}>Resumo</Text>
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

            <TouchableOpacity style={style.ctaButton} onPress={handleConfirmOrder}>
              <Text style={style.ctaButtonText}>Confirmar pedido</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
