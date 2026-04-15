import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import AppBottomNav from "../../components/app-bottom-nav";
import ThemeToggle from "../../components/theme-toggle";
import {
  getOrderStateModel,
  getOrderTimeline,
  isOrderTransitionAllowed,
  OperationalNotification,
  OrderItemRecord,
  OrderStatusCode,
  isActiveOrder,
} from "../../data/orders";
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
  notifications?: OperationalNotification[];
  sellerAvailability?: Record<string, boolean>;
  onAdvanceOrder?: (orderId: string, targetStatus?: OrderStatusCode) => void;
  onToggleSellerAvailability?: (storeId: string) => void;
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
  notifications,
  sellerAvailability,
  onAdvanceOrder,
  onToggleSellerAvailability,
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
  const visibleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return (notifications ?? []).filter((notification) => notification.audienceUserId === currentUser.id);
  }, [currentUser, notifications]);

  const sellerStore =
    currentUser?.role === "seller" && currentUser.sellerStoreId
      ? getStoreById(storesData, currentUser.sellerStoreId)
      : undefined;

  const sellerQueueSummary = useMemo(() => {
    return activeOrders.reduce(
      (summary, order) => {
        summary.total += 1;
        summary[order.status] += 1;
        return summary;
      },
      {
        total: 0,
        placed: 0,
        confirmed: 0,
        preparing: 0,
        ready_for_dispatch: 0,
        out_for_delivery: 0,
      } as Record<OrderStatusCode | "total", number>
    );
  }, [activeOrders]);

  const sellerQueueStages = [
    { key: "placed", label: "Novos pedidos", value: sellerQueueSummary.placed },
    { key: "confirmed", label: "Confirmados", value: sellerQueueSummary.confirmed },
    { key: "preparing", label: "Em preparo", value: sellerQueueSummary.preparing },
    {
      key: "ready_for_dispatch",
      label: "Aguardando motoboy",
      value: sellerQueueSummary.ready_for_dispatch,
    },
    {
      key: "out_for_delivery",
      label: "Em rota",
      value: sellerQueueSummary.out_for_delivery,
    },
  ];

  function getOrderItemsLabel(order: OrderItemRecord) {
    return order.items
      .map((item) => {
        const beer = allBeers.find((entry) => entry.id === item.beerId);
        const beerName = beer ? beer.name : item.beerId;
        return `${item.quantity}x ${beerName}`;
      })
      .join(", ");
  }

  function getStatusStyles(status: OrderStatusCode) {
    if (status === "delivered") {
      return {
        backgroundColor: theme.colors.success,
        textColor: theme.colors.textOnPrimary,
      };
    }

    if (status === "out_for_delivery") {
      return {
        backgroundColor: theme.colors.warning,
        textColor: theme.colors.textOnPrimary,
      };
    }

    if (status === "placed" || status === "confirmed") {
      return {
        backgroundColor: theme.colors.error,
        textColor: theme.colors.textPrimary,
      };
    }

    return {
      backgroundColor: theme.colors.primary,
      textColor: theme.colors.textOnPrimary,
    };
  }

  function renderOrderCard(order: OrderItemRecord, role: "buyer" | "seller") {
    const store = getStoreById(storesData, order.storeId);
    const state = getOrderStateModel(order.status);
    const nextStatus = state.next;
    const canCancel = isOrderTransitionAllowed(order.status, "cancelled");
    const statusStyle = getStatusStyles(order.status);
    const timeline = getOrderTimeline(order.status);

    return (
      <View key={order.id} style={style.card}>
        <View style={style.cardHeader}>
          <Text style={style.orderId}>#{order.id}</Text>
          <View style={[style.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[style.statusText, { color: statusStyle.textColor }]}>
              {role === "seller" ? state.partnerLabel : state.customerLabel}
            </Text>
          </View>
        </View>

        <Text style={style.cardText}>{store?.name || "Loja"}</Text>
        <Text style={style.cardText}>{getOrderItemsLabel(order)}</Text>
        <Text style={style.cardText}>Criado em {order.createdAt}</Text>
        {order.checkoutReference ? (
          <Text style={style.cardText}>Referencia do checkout: {order.checkoutReference}</Text>
        ) : null}
        <Text style={style.cardText}>SLA alvo: {order.slaMinutes} min</Text>
        <Text style={style.messageText}>
          {role === "seller" ? state.partnerMessage : state.customerMessage}
        </Text>

        <View style={style.timelineRow}>
          {timeline.map((step) => (
            <View
              key={step.label}
              style={[
                style.timelineDot,
                step.done ? style.timelineDotDone : undefined,
                step.current ? style.timelineDotCurrent : undefined,
              ]}
            />
          ))}
        </View>
        <Text style={style.timelineLabel}>{state.stepLabel} no fluxo operacional</Text>

        {role === "seller" && nextStatus ? (
          <TouchableOpacity style={style.advanceButton} onPress={() => onAdvanceOrder?.(order.id, nextStatus)}>
            <Text style={style.advanceButtonText}>
              Avancar para {getOrderStateModel(nextStatus).partnerLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
        {role === "seller" && canCancel ? (
          <TouchableOpacity style={style.cancelButton} onPress={() => onAdvanceOrder?.(order.id, "cancelled")}>
            <Text style={style.cancelButtonText}>Cancelar pedido</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const isSeller = currentUser?.role === "seller";
  const sellerIsOnline = sellerStore ? Boolean(sellerAvailability?.[sellerStore.id]) : false;

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        <Text style={style.title}>Operacao de pedidos</Text>
        <Text style={style.subtitle}>
          {currentUser
            ? isSeller
              ? "Console do parceiro para disponibilidade, fila e avancos de status."
              : "Timeline do seu pedido com status operacional e SLA de entrega."
            : "Entre com uma conta para acompanhar pedidos ativos e historico."}
        </Text>

        {!currentUser ? (
          <View style={style.emptyCard}>
            <Text style={style.emptyText}>
              Como visitante, voce pode explorar o app, mas nao consegue acompanhar pedidos.
            </Text>
            <TouchableOpacity style={style.ctaButton} onPress={onRequestLogin}>
              <Text style={style.ctaButtonText}>Ir para login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {isSeller && sellerStore ? (
              <View style={style.consoleCard}>
                <View style={style.consoleHeader}>
                  <Text style={style.consoleTitle}>Parceiro: {sellerStore.name}</Text>
                  <TouchableOpacity
                    style={[
                      style.availabilityButton,
                      sellerIsOnline ? style.availabilityOn : style.availabilityOff,
                    ]}
                    onPress={() => onToggleSellerAvailability?.(sellerStore.id)}
                  >
                    <Text style={style.availabilityButtonText}>
                      {sellerIsOnline ? "Recebendo pedidos" : "Pausado"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={style.queueSummaryCard}>
                  <Text style={style.queueSummaryLabel}>Fila ativa agora</Text>
                  <Text style={style.queueSummaryValue}>{sellerQueueSummary.total} pedidos</Text>
                </View>

                <View style={style.queueColumns}>
                  {sellerQueueStages.map((stage) => (
                    <View key={stage.key} style={style.queueColumnItem}>
                      <Text style={style.queueColumnLabel}>{stage.label}</Text>
                      <Text style={style.queueColumnValue}>{stage.value}</Text>
                    </View>
                  ))}
                </View>
                <Text style={style.consoleHint}>
                  {sellerIsOnline
                    ? "Novos pedidos entram automaticamente em 'Novo pedido'."
                    : "Loja pausada: novos pedidos sao bloqueados no checkout."}
                </Text>
              </View>
            ) : null}

            <Text style={style.sectionTitle}>Atualizacoes operacionais</Text>
            {visibleNotifications.length === 0 ? (
              <View style={style.emptyCard}>
                <Text style={style.emptyText}>Sem notificacoes recentes.</Text>
              </View>
            ) : (
              visibleNotifications.slice(0, 6).map((notification) => (
                <View key={notification.id} style={style.notificationCard}>
                  <View style={style.notificationHeader}>
                    <Text style={style.notificationTitle}>{notification.title}</Text>
                    <View
                      style={[
                        style.channelBadge,
                        notification.channel === "push" ? style.channelPush : style.channelInApp,
                      ]}
                    >
                      <Text style={style.channelBadgeText}>
                        {notification.channel === "push" ? "Push" : "Fallback"}
                      </Text>
                    </View>
                  </View>
                  <Text style={style.cardText}>{notification.message}</Text>
                  <Text style={style.timelineLabel}>{notification.createdAt}</Text>
                </View>
              ))
            )}

            <Text style={style.sectionTitle}>Ativos</Text>
            {activeOrders.length === 0 ? (
              <View style={style.emptyCard}>
                <Text style={style.emptyText}>Nenhum pedido em andamento no momento.</Text>
              </View>
            ) : (
              activeOrders.map((order) => renderOrderCard(order, isSeller ? "seller" : "buyer"))
            )}

            <Text style={style.sectionTitle}>Historico</Text>
            {pastOrders.length === 0 ? (
              <View style={style.emptyCard}>
                <Text style={style.emptyText}>Nenhum pedido finalizado por enquanto.</Text>
              </View>
            ) : (
              pastOrders.map((order) => renderOrderCard(order, isSeller ? "seller" : "buyer"))
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
