import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  getDefaultNextOrderStatus,
  getOrderStateModel,
  initialOrders,
  isOrderTransitionAllowed,
  OperationalNotification,
  OrderItemRecord,
  OrderStatusCode,
} from "./src/data/orders";
import { SellerProductDraft } from "./src/pages/profile";
import { getAllBeers, getBeerById, getStoreById, initialStores, StoreItem } from "./src/data/stores";
import { authenticateUser, demoUsers, getUserById, UserProfile } from "./src/data/users";
import {
  CatalogFilterPreset,
  DiscoveryCampaign,
  DiscoveryHighlight,
  DiscoveryStoryStep,
  catalogFilterPresets,
  discoveryStorySteps,
  homeCampaigns,
  homeHighlights,
} from "./src/data/discovery";
import { getTheme, ThemeMode } from "./src/global/themes";
import BeerDetails from "./src/pages/beer-details";
import Cart from "./src/pages/cart";
import Catalog, { CatalogMode } from "./src/pages/catalog";
import Checkout from "./src/pages/checkout";
import Landing from "./src/pages/landing";
import Login from "./src/pages/login";
import Orders from "./src/pages/orders";
import Profile from "./src/pages/profile";
import Search from "./src/pages/search";
import StoreDetails from "./src/pages/store-details";
import {
  CheckoutDraft,
  SelectedAddOn,
  formatCurrency,
  getCartItemsCount,
  getCartSubtotal,
  getCheckoutTotals,
  getUpsellSuggestions,
  initialCartState,
  parsePriceToNumber,
} from "./src/data/commerce";
import { getItem, removeItem, saveItem } from "./src/utils/storage";
import {
  flushInventorySyncQueueWithRetry,
  loadCatalogRuntimeData,
  queueInventoryAdjustment,
} from "./src/services/catalog/repository";
import { localCheckoutGateway } from "./src/services/checkout/local";

type Route =
  | { name: "login" }
  | { name: "landing" }
  | { name: "search" }
  | { name: "orders" }
  | { name: "profile" }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "catalog"; mode: CatalogMode }
  | { name: "store-details"; storeId: string }
  | { name: "beer-details"; beerId: string };

const THEME_STORAGE_KEY = "choppnow-theme-mode";
const CART_STORAGE_KEY_PREFIX = "choppnow-cart";
const INITIAL_SELLER_AVAILABILITY = initialStores.reduce<Record<string, boolean>>((acc, store) => {
  acc[store.id] = true;
  return acc;
}, {});

function getCartStorageKey(userId: string) {
  return `${CART_STORAGE_KEY_PREFIX}:${userId}`;
}

function isPersistedCartState(value: unknown): value is typeof initialCartState {
  if (!value || typeof value !== "object") return false;
  const cart = value as typeof initialCartState;
  return (
    (typeof cart.storeId === "string" || cart.storeId === null) &&
    (typeof cart.storeName === "string" || cart.storeName === null) &&
    Array.isArray(cart.items)
  );
}

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([{ name: "landing" }]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [storesData, setStoresData] = useState<StoreItem[]>(initialStores);
  const [discoveryHighlights, setDiscoveryHighlights] = useState<DiscoveryHighlight[]>(homeHighlights);
  const [discoveryCampaigns, setDiscoveryCampaigns] = useState<DiscoveryCampaign[]>(homeCampaigns);
  const [discoveryStory, setDiscoveryStory] = useState<DiscoveryStoryStep[]>(discoveryStorySteps);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilterPreset[]>(catalogFilterPresets);
  const [orders, setOrders] = useState(initialOrders);
  const [notifications, setNotifications] = useState<OperationalNotification[]>([]);
  const [cart, setCart] = useState(initialCartState);
  const [sellerAvailability, setSellerAvailability] = useState<Record<string, boolean>>(
    INITIAL_SELLER_AVAILABILITY
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const currentRoute = routes[routes.length - 1];
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const allBeers = useMemo(() => getAllBeers(storesData), [storesData]);
  const cartItemsCount = useMemo(() => getCartItemsCount(cart), [cart]);

  useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      try {
        const savedTheme = await getItem<ThemeMode>(THEME_STORAGE_KEY);
        if (!mounted) return;
        if (savedTheme === "dark" || savedTheme === "light") {
          setThemeMode(savedTheme);
        }
      } catch {
        // Keep default theme when storage is unavailable.
      } finally {
        if (mounted) {
          setIsThemeReady(true);
        }
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;

    saveItem(THEME_STORAGE_KEY, themeMode).catch(() => {
      // Ignore persistence failures and keep app usable.
    });
  }, [themeMode, isThemeReady]);

  useEffect(() => {
    let mounted = true;

    async function loadPersistedCart() {
      if (!currentUser || currentUser.role !== "buyer") return;
      const stored = await getItem<typeof initialCartState>(getCartStorageKey(currentUser.id));
      if (!mounted) return;
      if (isPersistedCartState(stored)) {
        setCart(stored);
      }
    }

    loadPersistedCart().catch(() => {
      // Ignore cart hydration errors and keep current runtime cart.
    });

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "buyer") return;

    if (cart.items.length === 0) {
      removeItem(getCartStorageKey(currentUser.id)).catch(() => {
        // Ignore local storage cleanup errors.
      });
      return;
    }

    saveItem(getCartStorageKey(currentUser.id), cart).catch(() => {
      // Ignore cart persistence errors and keep checkout path usable.
    });
  }, [cart, currentUser]);

  useEffect(() => {
    let mounted = true;

    async function loadCatalogData() {
      const runtimeCatalog = await loadCatalogRuntimeData();
      if (!mounted) return;
      setStoresData(runtimeCatalog.storesData);
      setDiscoveryHighlights(runtimeCatalog.snapshot.discovery.highlights);
      setDiscoveryCampaigns(runtimeCatalog.snapshot.discovery.campaigns);
      setDiscoveryStory(runtimeCatalog.snapshot.discovery.storySteps);
      setCatalogFilters(runtimeCatalog.snapshot.discovery.filters);
    }

    loadCatalogData().catch(() => {
      // App remains functional with seeded in-memory state.
    });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedStore = useMemo(() => {
    if (currentRoute.name !== "store-details") return undefined;
    return getStoreById(storesData, currentRoute.storeId);
  }, [currentRoute, storesData]);

  const selectedBeer = useMemo(() => {
    if (currentRoute.name !== "beer-details") return undefined;
    return getBeerById(storesData, currentRoute.beerId);
  }, [currentRoute, storesData]);

  const upsellBeers = useMemo(() => {
    if (currentRoute.name !== "beer-details") return [];
    if (!selectedBeer) return [];
    return getUpsellSuggestions(allBeers, selectedBeer.id, selectedBeer.storeId);
  }, [allBeers, currentRoute, selectedBeer]);

  function pushRoute(route: Route) {
    setRoutes((prev) => [...prev, route]);
  }

  function setRootRoute(route: Route) {
    setRoutes([route]);
  }

  function resetToLogin() {
    setRootRoute({ name: "login" });
  }

  function resetToLanding() {
    setRootRoute({ name: "landing" });
  }

  function openSearch() {
    setRootRoute({ name: "search" });
  }

  function openOrders() {
    setRootRoute({ name: "orders" });
  }

  function openProfile() {
    setRootRoute({ name: "profile" });
  }

  function openCart() {
    pushRoute({ name: "cart" });
  }

  function goBack() {
    setRoutes((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function toggleTheme() {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function openAccountEntry() {
    if (currentUser) {
      openProfile();
      return;
    }
    resetToLogin();
  }

  function handleSignIn(email: string, password: string) {
    const user = authenticateUser(email, password);
    if (!user) return false;

    setCurrentUser(user);
    setCart(initialCartState);
    setRootRoute({ name: "landing" });
    return true;
  }

  function handleUseDemoAccount(userId: string) {
    const user = getUserById(userId);
    if (!user) return;

    setCurrentUser(user);
    setCart(initialCartState);
    setRootRoute({ name: "profile" });
  }

  function handleSignOut() {
    setCurrentUser(null);
    setCart(initialCartState);
    setRootRoute({ name: "login" });
  }

  function handleAddToCart(
    beerId: string,
    quantity: number,
    addOns: SelectedAddOn[],
    options?: { openCartAfterAdd?: boolean }
  ) {
    if (!currentUser || currentUser.role !== "buyer") return;

    const beer = getBeerById(storesData, beerId);
    if (!beer) return;

    const normalizedAddOns = addOns
      .filter((addOn) => addOn.quantity > 0)
      .map((addOn) => ({
        id: addOn.id,
        label: addOn.label,
        price: addOn.price,
        quantity: addOn.quantity,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
    const addOnSignature = normalizedAddOns.map((entry) => `${entry.id}:${entry.quantity}`).join("|") || "base";
    const itemId = `${beer.id}::${addOnSignature}`;

    setCart((prev) => {
      const shouldResetStore = Boolean(prev.storeId && prev.storeId !== beer.storeId);
      if (shouldResetStore && prev.storeName) {
        Alert.alert(
          "Carrinho atualizado",
          `Os itens de ${prev.storeName} foram substituidos por itens de ${beer.storeName}.`
        );
      }
      const baseItems = shouldResetStore ? [] : prev.items;
      const existingItem = baseItems.find((item) => item.id === itemId);
      const nextQuantity = Math.max(1, quantity);

      const nextItems = existingItem
        ? baseItems.map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity + nextQuantity } : item
          )
        : [
            ...baseItems,
            {
              id: itemId,
              beerId: beer.id,
              beerName: beer.name,
              beerStyle: beer.style,
              storeId: beer.storeId,
              storeName: beer.storeName,
              unitPrice: parsePriceToNumber(beer.price),
              quantity: nextQuantity,
              addOns: normalizedAddOns,
            },
          ];

      return {
        storeId: beer.storeId,
        storeName: beer.storeName,
        items: nextItems,
      };
    });

    if (options?.openCartAfterAdd ?? true) {
      pushRoute({ name: "cart" });
    } else {
      Alert.alert("Item adicionado", "Upsell adicionado ao carrinho.");
    }
  }

  function clearCart() {
    setCart(initialCartState);
  }

  function handleIncreaseCartItem(itemId: string) {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item)),
    }));
  }

  function handleDecreaseCartItem(itemId: string) {
    setCart((prev) => {
      const nextItems = prev.items
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0);
      if (nextItems.length === 0) return initialCartState;
      return { ...prev, items: nextItems };
    });
  }

  function handleRemoveCartItem(itemId: string) {
    setCart((prev) => {
      const nextItems = prev.items.filter((item) => item.id !== itemId);
      if (nextItems.length === 0) return initialCartState;
      return { ...prev, items: nextItems };
    });
  }

  async function handlePlaceOrder(draft: CheckoutDraft) {
    if (!currentUser || currentUser.role !== "buyer") return;
    const checkoutStoreId = cart.storeId;
    if (!checkoutStoreId || cart.items.length === 0) return;
    const resolvedStoreId = checkoutStoreId;
    const checkoutCart = cart;
    if (!sellerAvailability[resolvedStoreId]) {
      Alert.alert("Parceiro pausado", "Este parceiro nao esta aceitando pedidos no momento.");
      return;
    }

    let checkoutResult: Awaited<ReturnType<typeof localCheckoutGateway.submitCheckout>>;
    try {
      checkoutResult = await localCheckoutGateway.submitCheckout(checkoutCart, draft);
    } catch {
      Alert.alert("Falha no checkout", "Nao foi possivel finalizar o checkout local.");
      return;
    }
    const subtotal = getCartSubtotal(checkoutCart);
    const { total } = getCheckoutTotals(subtotal, checkoutCart.items.length > 0);
    const formattedTotal = formatCurrency(total);
    const slaMinutes = draft.paymentMethod === "pix" ? 35 : 40;

    const nextOrder: OrderItemRecord = {
      id: `order-${Date.now()}`,
      buyerId: currentUser.id,
      storeId: resolvedStoreId,
      items: checkoutCart.items.map((item) => ({
        beerId: item.beerId,
        quantity: item.quantity,
      })),
      total: formattedTotal,
      createdAt: "Agora",
      slaMinutes,
      status: "placed",
    };

    setOrders((prev) => [nextOrder, ...prev]);
    createOperationalNotifications(nextOrder, "placed");

    Promise.all(
      checkoutCart.items.map((item) =>
        queueInventoryAdjustment(item.beerId, -item.quantity, "checkout-order-placed")
      )
    )
      .then(() => flushInventorySyncQueueWithRetry({ maxAttempts: 2, retryDelayMs: 700 }))
      .then(() => loadCatalogRuntimeData())
      .then((runtimeCatalog) => {
        setStoresData(runtimeCatalog.storesData);
        setDiscoveryHighlights(runtimeCatalog.snapshot.discovery.highlights);
        setDiscoveryCampaigns(runtimeCatalog.snapshot.discovery.campaigns);
        setDiscoveryStory(runtimeCatalog.snapshot.discovery.storySteps);
        setCatalogFilters(runtimeCatalog.snapshot.discovery.filters);
      })
      .catch(() => {
        // Keep checkout flow resilient if inventory sync queue is unavailable.
      });

    setCart(initialCartState);
    setRootRoute({ name: "orders" });
    Alert.alert("Pedido recebido", `Checkout local confirmado (${checkoutResult.placeholderReference}).`);
  }

  function handleAddProduct(draft: SellerProductDraft) {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return;

    const generatedId = `${draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    setStoresData((prev) =>
      prev.map((store) =>
        store.id === currentUser.sellerStoreId
          ? {
              ...store,
              beers: [
                {
                  id: generatedId,
                  name: draft.name.trim(),
                  style: draft.style.trim(),
                  abv: draft.abv.trim(),
                  price: draft.price.trim(),
                  description: draft.description.trim(),
                  ibu: draft.ibu,
                  rating: 4.5,
                },
                ...store.beers,
              ],
            }
          : store
      )
    );
  }

  function formatNotificationTime() {
    return new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getSellerUserByStoreId(storeId: string) {
    return demoUsers.find((user) => user.role === "seller" && user.sellerStoreId === storeId);
  }

  function createOperationalNotifications(order: OrderItemRecord, nextStatus: OrderStatusCode) {
    const buyer = getUserById(order.buyerId);
    const seller = getSellerUserByStoreId(order.storeId);
    const nextState = getOrderStateModel(nextStatus);
    const createdAt = formatNotificationTime();

    const nextNotifications: OperationalNotification[] = [];

    if (buyer) {
      nextNotifications.push({
        id: `${order.id}-buyer-${Date.now()}`,
        orderId: order.id,
        audienceUserId: buyer.id,
        status: nextStatus,
        title: `Pedido #${order.id} - ${nextState.customerLabel}`,
        message: nextState.customerMessage,
        channel: buyer.notificationsEnabled ? "push" : "in_app",
        createdAt,
      });
    }

    if (seller) {
      nextNotifications.push({
        id: `${order.id}-seller-${Date.now()}`,
        orderId: order.id,
        audienceUserId: seller.id,
        status: nextStatus,
        title: `Pedido #${order.id} - ${nextState.partnerLabel}`,
        message: nextState.partnerMessage,
        channel: seller.notificationsEnabled ? "push" : "in_app",
        createdAt,
      });
    }

    if (nextNotifications.length > 0) {
      setNotifications((prev) => [...nextNotifications, ...prev].slice(0, 30));
    }
  }

  function handleAdvanceOrder(orderId: string, targetStatus?: OrderStatusCode) {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return;

    const currentOrder = orders.find(
      (order) => order.id === orderId && order.storeId === currentUser.sellerStoreId
    );
    if (!currentOrder) {
      Alert.alert("Pedido nao encontrado", "Este pedido nao esta disponivel para sua loja.");
      return;
    }

    const nextStatus = targetStatus ?? getDefaultNextOrderStatus(currentOrder.status);
    if (!nextStatus) {
      Alert.alert("Transicao bloqueada", "Este pedido ja esta em estado terminal.");
      return;
    }

    if (!isOrderTransitionAllowed(currentOrder.status, nextStatus)) {
      Alert.alert("Transicao bloqueada", `Transicao invalida: ${currentOrder.status} -> ${nextStatus}.`);
      return;
    }

    const updatedOrder: OrderItemRecord = { ...currentOrder, status: nextStatus };

    setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
    createOperationalNotifications(updatedOrder, nextStatus);
  }

  function handleToggleSellerAvailability(storeId: string) {
    setSellerAvailability((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  }

  if (currentRoute.name === "store-details") {
    return (
      <StoreDetails
        store={selectedStore}
        onBack={goBack}
        onRequestLogin={openAccountEntry}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "beer-details") {
    return (
      <BeerDetails
        beer={selectedBeer}
        currentUser={currentUser}
        onBack={goBack}
        onRequestLogin={openAccountEntry}
        onOpenStore={(storeId) => pushRoute({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        onOpenCart={openCart}
        onAddToCart={handleAddToCart}
        onQuickAddUpsell={(beerId) => handleAddToCart(beerId, 1, [], { openCartAfterAdd: false })}
        upsellBeers={upsellBeers}
        cartItemsCount={cartItemsCount}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "cart") {
    return (
      <Cart
        currentUser={currentUser}
        cart={cart}
        onBack={goBack}
        onRequestLogin={resetToLogin}
        onIncreaseQuantity={handleIncreaseCartItem}
        onDecreaseQuantity={handleDecreaseCartItem}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={clearCart}
        onProceedCheckout={() => pushRoute({ name: "checkout" })}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "checkout") {
    return (
      <Checkout
        currentUser={currentUser}
        cart={cart}
        onBack={goBack}
        onRequestLogin={resetToLogin}
        onPlaceOrder={handlePlaceOrder}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "catalog") {
    return (
      <Catalog
        mode={currentRoute.mode}
        storesData={storesData}
        campaigns={discoveryCampaigns}
        filterPresets={catalogFilters}
        onBack={goBack}
        onRequestLogin={openAccountEntry}
        onOpenStore={(storeId) => pushRoute({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "search") {
    return (
      <Search
        storesData={storesData}
        onOpenStore={(storeId) => pushRoute({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        onOpenHome={resetToLanding}
        onOpenOrders={openOrders}
        onOpenProfile={openProfile}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "orders") {
    return (
      <Orders
        currentUser={currentUser}
        orders={orders}
        storesData={storesData}
        notifications={notifications}
        onAdvanceOrder={handleAdvanceOrder}
        sellerAvailability={sellerAvailability}
        onToggleSellerAvailability={handleToggleSellerAvailability}
        onRequestLogin={openAccountEntry}
        onOpenHome={resetToLanding}
        onOpenSearch={openSearch}
        onOpenProfile={openProfile}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "profile") {
    return (
      <Profile
        currentUser={currentUser}
        storesData={storesData}
        orders={orders}
        onRequestLogin={resetToLogin}
        onUseDemoAccount={handleUseDemoAccount}
        onSignOut={handleSignOut}
        onOpenStore={(storeId) => pushRoute({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        onAddProduct={handleAddProduct}
        onAdvanceOrder={handleAdvanceOrder}
        onOpenHome={resetToLanding}
        onOpenSearch={openSearch}
        onOpenOrders={openOrders}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "landing") {
    return (
      <Landing
        currentUser={currentUser}
        storesData={storesData}
        highlights={discoveryHighlights}
        campaigns={discoveryCampaigns}
        storySteps={discoveryStory}
        onHeaderAction={openAccountEntry}
        headerActionLabel={currentUser ? "Perfil" : "Entrar"}
        onOpenStore={(storeId) => pushRoute({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        onOpenStoreList={() => pushRoute({ name: "catalog", mode: "stores" })}
        onOpenBeerList={() => pushRoute({ name: "catalog", mode: "beers" })}
        onOpenCatalog={(mode) => pushRoute({ name: "catalog", mode })}
        onOpenSearch={openSearch}
        onOpenOrders={openOrders}
        onOpenProfile={openProfile}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Login
      onContinueAsGuest={resetToLanding}
      onSignIn={handleSignIn}
      theme={theme}
      themeMode={themeMode}
      onToggleTheme={toggleTheme}
    />
  );
}
