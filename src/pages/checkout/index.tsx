import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import {
  CartState,
  CheckoutDraft,
  formatCurrency,
  getCartSubtotal,
  getCheckoutTotals,
} from "../../data/commerce";
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
  onPlaceOrder?: (draft: CheckoutDraft) => Promise<void> | void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getCartSubtotal(cart);
  const { deliveryFee, serviceFee, total } = getCheckoutTotals(subtotal, cart.items.length > 0);
  const isBuyer = currentUser?.role === "buyer";
  const deliveryAddress = currentUser?.address?.trim() || "Endereco pendente de cadastro";

  async function handleConfirmOrder() {
    if (!onPlaceOrder || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onPlaceOrder({
        paymentMethod,
        deliveryNotes: deliveryNotes.trim(),
        couponCode: couponCode.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <Text style={style.subtitle}>
          Finalize seu pedido com persistencia local operacional enquanto a integracao real nao entra.
        </Text>

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
              <Text style={style.blockText}>Endereco de entrega:</Text>
              <Text style={style.blockStrong}>{deliveryAddress}</Text>
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

            <TouchableOpacity
              style={[style.ctaButton, isSubmitting ? style.ctaButtonDisabled : null]}
              onPress={handleConfirmOrder}
              disabled={isSubmitting}
            >
              <Text style={style.ctaButtonText}>
                {isSubmitting ? "Enviando pedido..." : "Confirmar pedido"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
