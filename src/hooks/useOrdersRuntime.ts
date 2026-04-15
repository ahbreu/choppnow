import { useEffect, useState } from "react";
import { OperationalNotification, OrderItemRecord } from "../data/orders";
import {
  createInitialOrdersRuntimeState,
  loadOrdersRuntimeState,
  OrdersRuntimeState,
  persistOrdersRuntimeState,
  prependOperationalNotifications,
  upsertRuntimeOrder,
} from "../services/orders/storage";

type UseOrdersRuntimeOptions = {
  initialSellerAvailability: Record<string, boolean>;
};

export function useOrdersRuntime({ initialSellerAvailability }: UseOrdersRuntimeOptions) {
  const initialState = createInitialOrdersRuntimeState(initialSellerAvailability);
  const [orders, setOrders] = useState<OrderItemRecord[]>(() => initialState.orders);
  const [notifications, setNotifications] = useState<OperationalNotification[]>(
    () => initialState.notifications
  );
  const [sellerAvailability, setSellerAvailability] = useState<Record<string, boolean>>(
    () => initialState.sellerAvailability
  );
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadOrdersRuntimeState(initialSellerAvailability)
      .then((state) => {
        if (!mounted) return;
        setOrders(state.orders);
        setNotifications(state.notifications);
        setSellerAvailability(state.sellerAvailability);
      })
      .catch(() => {
        if (!mounted) return;
        const fallbackState = createInitialOrdersRuntimeState(initialSellerAvailability);
        setOrders(fallbackState.orders);
        setNotifications(fallbackState.notifications);
        setSellerAvailability(fallbackState.sellerAvailability);
      })
      .finally(() => {
        if (mounted) {
          setHasHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialSellerAvailability]);

  useEffect(() => {
    if (!hasHydrated) return;

    const nextState: OrdersRuntimeState = {
      orders,
      notifications,
      sellerAvailability,
    };

    persistOrdersRuntimeState(nextState).catch(() => {
      // Keep the operational flow responsive even when local persistence is unavailable.
    });
  }, [hasHydrated, notifications, orders, sellerAvailability]);

  function appendNotifications(nextNotifications: OperationalNotification[]) {
    if (nextNotifications.length === 0) return;
    setNotifications((current) => prependOperationalNotifications(current, nextNotifications));
  }

  function registerPlacedOrder(order: OrderItemRecord, nextNotifications: OperationalNotification[]) {
    setOrders((current) => [order, ...current]);
    appendNotifications(nextNotifications);
  }

  function registerUpdatedOrder(
    updatedOrder: OrderItemRecord,
    nextNotifications: OperationalNotification[]
  ) {
    setOrders((current) => upsertRuntimeOrder(current, updatedOrder));
    appendNotifications(nextNotifications);
  }

  function toggleSellerAvailability(storeId: string) {
    setSellerAvailability((current) => ({
      ...current,
      [storeId]: !current[storeId],
    }));
  }

  return {
    orders,
    notifications,
    sellerAvailability,
    hasHydrated,
    registerPlacedOrder,
    registerUpdatedOrder,
    toggleSellerAvailability,
  };
}
