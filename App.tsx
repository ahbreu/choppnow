import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { advanceOrderStatus, initialOrders } from "./src/data/orders";
import { SellerProductDraft } from "./src/pages/profile";
import { getAllBeers, getBeerById, getStoreById, initialStores, StoreItem } from "./src/data/stores";
import { authenticateUser, getUserById, UserProfile } from "./src/data/users";
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
  AddOnOption,
  CheckoutDraft,
  formatCurrency,
  getCartItemsCount,
  getCartSubtotal,
  getUpsellSuggestions,
  initialCartState,
  parsePriceToNumber,
} from "./src/data/commerce";
import { getItem, saveItem } from "./src/utils/storage";

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
const INITIAL_SELLER_AVAILABILITY = initialStores.reduce<Record<string, boolean>>((acc, store) => {
  acc[store.id] = true;
  return acc;
}, {});

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([{ name: "landing" }]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [storesData, setStoresData] = useState<StoreItem[]>(initialStores);
  const [orders, setOrders] = useState(initialOrders);
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

  function handleAddToCart(beerId: string, quantity: number, addOns: AddOnOption[]) {
    if (!currentUser || currentUser.role !== "buyer") return;

    const beer = getBeerById(storesData, beerId);
    if (!beer) return;

    const groupedAddOns = addOns.reduce<Record<string, { label: string; price: number; quantity: number }>>(
      (acc, addOn) => {
        if (!acc[addOn.id]) {
          acc[addOn.id] = {
            label: addOn.label,
            price: addOn.price,
            quantity: 0,
          };
        }
        acc[addOn.id].quantity += 1;
        return acc;
      },
      {}
    );

    const normalizedAddOns = Object.entries(groupedAddOns)
      .map(([id, payload]) => ({ id, ...payload }))
      .sort((a, b) => a.id.localeCompare(b.id));
    const addOnSignature = normalizedAddOns.map((entry) => `${entry.id}:${entry.quantity}`).join("|") || "base";
    const itemId = `${beer.id}::${addOnSignature}`;

    setCart((prev) => {
      const shouldResetStore = Boolean(prev.storeId && prev.storeId !== beer.storeId);
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

    pushRoute({ name: "cart" });
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

  function handlePlaceOrder(draft: CheckoutDraft) {
    if (!currentUser || currentUser.role !== "buyer") return;
    if (!cart.storeId || cart.items.length === 0) return;
    const checkoutStoreId = cart.storeId;
    if (!sellerAvailability[checkoutStoreId]) {
      Alert.alert("Parceiro pausado", "Este parceiro nao esta aceitando pedidos no momento.");
      return;
    }

    const subtotal = getCartSubtotal(cart);
    const deliveryFee = 7.9;
    const serviceFee = 2.5;
    const total = formatCurrency(subtotal + deliveryFee + serviceFee);
    const slaMinutes = draft.paymentMethod === "pix" ? 35 : 40;

    setOrders((prev) => [
      {
        id: `order-${Date.now()}`,
        buyerId: currentUser.id,
        storeId: checkoutStoreId,
        items: cart.items.map((item) => ({
          beerId: item.beerId,
          quantity: item.quantity,
        })),
        total,
        createdAt: "Agora",
        slaMinutes,
        status: "placed",
      },
      ...prev,
    ]);

    setCart(initialCartState);
    setRootRoute({ name: "orders" });
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

  function handleAdvanceOrder(orderId: string) {
    if (!currentUser || currentUser.role !== "seller" || !currentUser.sellerStoreId) return;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId && order.storeId === currentUser.sellerStoreId
          ? { ...order, status: advanceOrderStatus(order.status) }
          : order
      )
    );
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
