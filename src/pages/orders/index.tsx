import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import AppBottomNav from "../../components/app-bottom-nav";
import ThemeToggle from "../../components/theme-toggle";
import { OrderItemRecord, isActiveOrder } from "../../data/orders";
import { StoreItem, getAllBeers, getStoreById } from "../../data/stores";
import { UserProfile } from "../../data/users";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

type OrdersProps = {
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
  currentUser: UserProfile | null;
  orders: OrderItemRecord[];
  storesData: StoreItem[];
  onOpenHome?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onRequestLogin?: () => void;
};

export default function Orders({
  theme,
  themeMode,
  onToggleTheme,
  currentUser,
  orders,
  storesData,
  onOpenHome,
  onOpenSearch,
  onOpenProfile,
  onRequestLogin,
}: OrdersProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const allBeers = useMemo(() => getAllBeers(storesData), [storesData]);

  const visibleOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "seller" && currentUser.sellerStoreId) {
      return orders.filter((order) => order.storeId === currentUser.sellerStoreId);
    }
    return orders.filter((order) => order.buyerId === currentUser.id);
  }, [currentUser, orders]);

  const activeOrders = visibleOrders.filter((order) => isActiveOrder(order.status));
  const pastOrders = visibleOrders.filter((order) => !isActiveOrder(order.status));

  function getOrderItemsLabel(order: OrderItemRecord) {
    return order.items
      .map((item) => {
        const beer = allBeers.find((entry) => entry.id === item.beerId);
        const beerName = beer ? beer.name : item.beerId;
        return `${item.quantity}x ${beerName}`;
      })
      .join(", ");
  }

  function getStatusStyles(status: OrderItemRecord["status"]) {
    if (status === "Entregue") {
      return {
        backgroundColor: theme.colors.accentSoft,
        textColor: theme.colors.accent,
      };
    }
    if (status === "Saiu para entrega") {
      return {
        backgroundColor: theme.colors.primaryGlow,
        textColor: theme.colors.textOnPrimary,
      };
    }
    return {
      backgroundColor: theme.colors.surfaceElevated,
      textColor: theme.colors.primary,
    };
  }

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        <Text style={style.title}>Pedidos</Text>
        <Text style={style.subtitle}>
          {currentUser
            ? currentUser.role === "seller"
              ? "Acompanhe os pedidos da sua cervejaria e os status de entrega."
              : "Veja seus pedidos atuais e o historico de compras."
            : "Entre com uma conta para acompanhar pedidos ativos e historico."}
        </Text>

        {!currentUser ? (
          <View style={style.emptyCard}>
            <Text style={style.emptyText}>
              Como visitante, voce pode explorar o app, mas nao consegue acompanhar pedidos. Entre com uma conta de teste para validar esse fluxo.
            </Text>
            <TouchableOpacity style={style.ctaButton} onPress={onRequestLogin}>
              <Text style={style.ctaButtonText}>Ir para login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={style.sectionTitle}>Atuais</Text>
            {activeOrders.length === 0 ? (
              <View style={style.emptyCard}>
                <Text style={style.emptyText}>Nenhum pedido em andamento no momento.</Text>
              </View>
            ) : (
              activeOrders.map((order) => {
                const store = getStoreById(storesData, order.storeId);
                const statusStyle = getStatusStyles(order.status);
                return (
                  <View key={order.id} style={style.card}>
                    <View style={style.cardHeader}>
                      <Text style={style.orderId}>#{order.id}</Text>
                      <View style={[style.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[style.statusText, { color: statusStyle.textColor }]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={style.cardText}>{store?.name || "Loja"}</Text>
                    <Text style={style.cardText}>{getOrderItemsLabel(order)}</Text>
                    <Text style={style.cardText}>
                      Feito em {order.createdAt} - ETA {order.eta}
                    </Text>
                    <Text style={style.totalText}>{order.total}</Text>
                  </View>
                );
              })
            )}

            <Text style={style.sectionTitle}>Historico</Text>
            {pastOrders.length === 0 ? (
              <View style={style.emptyCard}>
                <Text style={style.emptyText}>Nenhum pedido finalizado por enquanto.</Text>
              </View>
            ) : (
              pastOrders.map((order) => {
                const store = getStoreById(storesData, order.storeId);
                const statusStyle = getStatusStyles(order.status);
                return (
                  <View key={order.id} style={style.card}>
                    <View style={style.cardHeader}>
                      <Text style={style.orderId}>#{order.id}</Text>
                      <View style={[style.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[style.statusText, { color: statusStyle.textColor }]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={style.cardText}>{store?.name || "Loja"}</Text>
                    <Text style={style.cardText}>{getOrderItemsLabel(order)}</Text>
                    <Text style={style.cardText}>Finalizado - {order.createdAt}</Text>
                    <Text style={style.totalText}>{order.total}</Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <AppBottomNav
        theme={theme}
        activeTab="orders"
        onOpenHome={onOpenHome}
        onOpenSearch={onOpenSearch}
        onOpenOrders={() => undefined}
        onOpenProfile={onOpenProfile}
      />
    </View>
  );
}

