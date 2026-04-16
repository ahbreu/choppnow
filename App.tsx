import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  initialOrders,
  OperationalNotification,
  OrderStatusCode,
} from "./src/data/orders";
import { SellerProductDraft } from "./src/pages/profile";
import { getAllBeers, getBeerById, getStoreById, initialStores } from "./src/data/stores";
import { getTheme } from "./src/global/themes";
import BeerDetails from "./src/pages/beer-details";
import Cart from "./src/pages/cart";
import Catalog from "./src/pages/catalog";
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
  getCartItemsCount,
  getUpsellSuggestions,
  initialCartState,
  parsePriceToNumber,
} from "./src/data/commerce";
import {
  flushInventorySyncQueueWithRetry,
  publishCatalogProduct,
  queueInventoryAdjustment,
} from "./src/services/catalog/repository";
import { useAuthSession } from "./src/hooks/useAuthSession";
import { useBuyerCartPersistence } from "./src/hooks/useBuyerCartPersistence";
import { useCatalogRuntime } from "./src/hooks/useCatalogRuntime";
import { useOrdersRuntime } from "./src/hooks/useOrdersRuntime";
import { useThemePreference } from "./src/hooks/useThemePreference";
import { Route } from "./src/navigation/routes";
import { OrdersGatewayError } from "./src/services/orders/gateway";
import { advanceOrderWithFallback, placeOrderWithFallback } from "./src/services/orders/runtime";

const INITIAL_SELLER_AVAILABILITY = initialStores.reduce<Record<string, boolean>>((acc, store) => {
  acc[store.id] = true;
  return acc;
}, {});

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([{ name: "landing" }]);
  const { themeMode, setThemeMode } = useThemePreference("dark");
  const {
    storesData,
    catalogStores,
    catalogInventoryRecords,
    discoveryHighlights,
    discoveryCampaigns,
    discoveryStory,
    catalogFilters,
    refreshCatalogRuntime,
  } = useCatalogRuntime();
  const [cart, setCart] = useState(initialCartState);
  const {
    authMessage,
    currentUser,
    demoAccounts,
    googleStatusMessage,
    isGoogleLoading,
    signInWithDemoAccount,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    canSignInWithGoogle,
  } = useAuthSession();
  const {
    orders,
    notifications,
    sellerAvailability,
    registerPlacedOrder,
    registerUpdatedOrder,
    toggleSellerAvailability,
  } = useOrdersRuntime({
    initialSellerAvailability: INITIAL_SELLER_AVAILABILITY,
    currentUser,
  });

  const currentRoute = routes[routes.length - 1];
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const allBeers = useMemo(() => getAllBeers(storesData), [storesData]);
  const cartItemsCount = useMemo(() => getCartItemsCount(cart), [cart]);

  useBuyerCartPersistence({
    currentUser,
    cart,
    setCart,
  });

  useEffect(() => {
    setCart(initialCartState);
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentRoute.name === "login" && currentUser) {
      setRootRoute({ name: "landing" });
    }
  }, [currentRoute.name, currentUser]);

  const selectedStore = useMemo(() => {
    if (currentRoute.name !== "store-details") return undefined;
    const visibleStore = getStoreById(storesData, currentRoute.storeId);
    if (visibleStore) return visibleStore;

    const runtimeStore = catalogStores.find((store) => store.id === currentRoute.storeId);
    if (!runtimeStore) return undefined;

    return {
      ...runtimeStore,
      beers: catalogInventoryRecords
        .filter((beer) => beer.storeId === runtimeStore.id && beer.currentIsAvailable)
        .map((beer) => ({
          id: beer.id,
          name: beer.name,
          style: beer.style,
          abv: beer.abv,
          price: beer.price,
          rating: beer.rating,
          description: beer.description,
          ibu: beer.ibu,
          inventory: {
            availableUnits: beer.currentAvailableUnits,
            isAvailable: beer.currentIsAvailable,
            lastSyncedAt: beer.inventory.lastSyncedAt,
          },
          isLocalOnly: beer.isLocalOnly,
        })),
    };
  }, [catalogInventoryRecords, catalogStores, currentRoute, storesData]);

  const selectedBeer = useMemo(() => {
    if (currentRoute.name !== "beer-details") return undefined;
    const visibleBeer = getBeerById(storesData, currentRoute.beerId);
    if (visibleBeer) return visibleBeer;

    const runtimeBeer = catalogInventoryRecords.find((beer) => beer.id === currentRoute.beerId);
    if (!runtimeBeer) return undefined;

    const runtimeStore = catalogStores.find((store) => store.id === runtimeBeer.storeId);
    if (!runtimeStore) return undefined;

    return {
      id: runtimeBeer.id,
      name: runtimeBeer.name,
      style: runtimeBeer.style,
      abv: runtimeBeer.abv,
      price: runtimeBeer.price,
      rating: runtimeBeer.rating,
      description: runtimeBeer.description,
      ibu: runtimeBeer.ibu,
      inventory: {
        availableUnits: runtimeBeer.currentAvailableUnits,
        isAvailable: runtimeBeer.currentIsAvailable,
        lastSyncedAt: runtimeBeer.inventory.lastSyncedAt,
      },
      isLocalOnly: runtimeBeer.isLocalOnly,
      storeId: runtimeStore.id,
      storeName: runtimeStore.name,
      storeShort: runtimeStore.short,
      storeAddress: runtimeStore.address,
    };
  }, [catalogInventoryRecords, catalogStores, currentRoute, storesData]);

  const upsellBeers = useMemo(() => {
    if (currentRoute.name !== "beer-details") return [];
    if (!selectedBeer) return [];
    return getUpsellSuggestions(allBeers, selectedBeer.id, selectedBeer.storeId);
  }, [allBeers, currentRoute, selectedBeer]);
  const sellerCatalogBeers = useMemo(() => {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return [];
    return catalogInventoryRecords
      .filter((beer) => beer.storeId === currentUser.sellerStoreId)
      .sort((left, right) => right.inventory.lastSyncedAt.localeCompare(left.inventory.lastSyncedAt));
  }, [catalogInventoryRecords, currentUser]);
  const sellerStore = useMemo(() => {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return null;
    return catalogStores.find((store) => store.id === currentUser.sellerStoreId) ?? null;
  }, [catalogStores, currentUser]);

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

  async function handleSignIn(email: string, password: string) {
    const signedIn = await signInWithEmail(email, password);
    if (!signedIn) return false;

    setRootRoute({ name: "landing" });
    return true;
  }

  async function handleUseDemoAccount(userId: string) {
    const signedIn = await signInWithDemoAccount(userId);
    if (!signedIn) return;

    setRootRoute({ name: "profile" });
  }

  async function handleGoogleSignIn() {
    await signInWithGoogle();
  }

  async function handleSignOut() {
    await signOut();
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

    try {
      const result = await placeOrderWithFallback({
        buyer: currentUser,
        cart: checkoutCart,
        draft,
        storeId: resolvedStoreId,
      });

      registerPlacedOrder(result.order, result.notifications);

      Promise.all(
        checkoutCart.items.map((item) =>
          queueInventoryAdjustment(item.beerId, -item.quantity, "checkout-order-placed")
        )
      )
        .then(() => flushInventorySyncQueueWithRetry({ maxAttempts: 2, retryDelayMs: 700 }))
        .then(() => refreshCatalogRuntime())
        .catch(() => {
          // Keep checkout flow resilient if inventory sync queue is unavailable.
        });

      setCart(initialCartState);
      setRootRoute({ name: "orders" });
      Alert.alert("Pedido recebido", `Pedido registrado (${result.checkoutReference}).`);
    } catch {
      Alert.alert("Falha no checkout", "Nao foi possivel finalizar o pedido agora.");
    }
  }

  async function handleAddProduct(draft: SellerProductDraft) {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return;

    try {
      const createdProduct = await publishCatalogProduct(currentUser.sellerStoreId, draft);
      await refreshCatalogRuntime();
      const publishTarget = createdProduct.isLocalOnly ? "catalogo local de contingencia" : "backend do catalogo";
      Alert.alert(
        "Produto publicado",
        `${createdProduct.name} entrou no ${publishTarget} com ${createdProduct.currentAvailableUnits} unidades.`
      );
    } catch {
      Alert.alert("Falha no catalogo", "Nao foi possivel publicar o produto nesta sessao.");
    }
  }

  async function handleAdjustInventory(beerId: string, deltaUnits: number) {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return;

    try {
      await queueInventoryAdjustment(
        beerId,
        deltaUnits,
        deltaUnits > 0 ? "seller-restock" : "seller-stock-adjustment"
      );
      await flushInventorySyncQueueWithRetry({ maxAttempts: 2, retryDelayMs: 700 });
      await refreshCatalogRuntime();
    } catch {
      Alert.alert("Falha no estoque", "Nao foi possivel atualizar o estoque agora.");
    }
  }

  async function handleAdvanceOrder(orderId: string, targetStatus?: OrderStatusCode) {
    if (!currentUser) return;

    try {
      const result = await advanceOrderWithFallback({
        currentUser,
        orders,
        orderId,
        targetStatus,
      });

      registerUpdatedOrder(result.updatedOrder, result.notifications);
    } catch (error) {
      if (error instanceof OrdersGatewayError) {
        if (error.code === "order_not_found") {
          Alert.alert("Pedido nao encontrado", error.message);
          return;
        }
        if (error.code === "terminal_order" || error.code === "invalid_transition") {
          Alert.alert("Transicao bloqueada", error.message);
          return;
        }
        if (error.code === "seller_forbidden") {
          Alert.alert("Acesso negado", error.message);
          return;
        }
      }

      Alert.alert("Falha operacional", "Nao foi possivel atualizar o pedido.");
    }
  }

  function handleToggleSellerAvailability(storeId: string) {
    toggleSellerAvailability(storeId);
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
        demoAccounts={demoAccounts}
        storesData={storesData}
        orders={orders}
        sellerStore={sellerStore}
        sellerCatalogBeers={sellerCatalogBeers}
        onRequestLogin={resetToLogin}
        onUseDemoAccount={handleUseDemoAccount}
        onSignOut={handleSignOut}
        onOpenStore={(storeId) => pushRoute({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => pushRoute({ name: "beer-details", beerId })}
        onAddProduct={handleAddProduct}
        onAdjustInventory={handleAdjustInventory}
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
      onSignInWithGoogle={handleGoogleSignIn}
      helperAccounts={demoAccounts}
      canSignInWithGoogle={canSignInWithGoogle}
      isGoogleLoading={isGoogleLoading}
      googleStatusMessage={googleStatusMessage}
      authStatusMessage={authMessage}
      theme={theme}
      themeMode={themeMode}
      onToggleTheme={toggleTheme}
    />
  );
}
