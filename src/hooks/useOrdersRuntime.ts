import { useEffect, useState } from "react";
import { OperationalNotification, OrderItemRecord } from "../data/orders";
import { UserProfile } from "../data/users";
import { fetchOrdersForCurrentUserWithFallback } from "../services/orders/runtime";
import {
  createInitialOrdersRuntimeState,
  loadOrdersRuntimeState,
  OrdersRuntimeState,
  persistOrdersRuntimeState,
  upsertRuntimeOrder,
  prependOperationalNotifications,
} from "../services/orders/storage";
import { mergeRemoteOrdersIntoRuntime } from "../services/orders/remote";

type UseOrdersRuntimeOptions = {
  initialSellerAvailability: Record<string, boolean>;
  currentUser: UserProfile | null;
};

export function useOrdersRuntime({ initialSellerAvailability, currentUser }: UseOrdersRuntimeOptions) {
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

  useEffect(() => {
    if (!hasHydrated || !currentUser) return;

    let mounted = true;

    fetchOrdersForCurrentUserWithFallback(currentUser)
      .then((remoteOrders) => {
        if (!mounted || !remoteOrders) return;
        setOrders((currentOrders) => mergeRemoteOrdersIntoRuntime(currentOrders, remoteOrders));
      })
      .catch(() => {
        // Keep local runtime state if remote sync is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, [currentUser, hasHydrated]);

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
