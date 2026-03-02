import { useMemo, useState } from "react";
import { advanceOrderStatus, initialOrders } from "./src/data/orders";
import { SellerProductDraft } from "./src/pages/profile";
import { getBeerById, getStoreById, initialStores, StoreItem } from "./src/data/stores";
import { authenticateUser, getUserById, UserProfile } from "./src/data/users";
import { getTheme, ThemeMode } from "./src/global/themes";
import BeerDetails from "./src/pages/beer-details";
import Catalog, { CatalogMode } from "./src/pages/catalog";
import Landing from "./src/pages/landing";
import Login from "./src/pages/login";
import Orders from "./src/pages/orders";
import Profile from "./src/pages/profile";
import Search from "./src/pages/search";
import StoreDetails from "./src/pages/store-details";

type Route =
  | { name: "login" }
  | { name: "landing" }
  | { name: "search" }
  | { name: "orders" }
  | { name: "profile" }
  | { name: "catalog"; mode: CatalogMode }
  | { name: "store-details"; storeId: string }
  | { name: "beer-details"; beerId: string };

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([{ name: "login" }]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [storesData, setStoresData] = useState<StoreItem[]>(initialStores);
  const [orders, setOrders] = useState(initialOrders);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const currentRoute = routes[routes.length - 1];
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  const selectedStore = useMemo(() => {
    if (currentRoute.name !== "store-details") return undefined;
    return getStoreById(storesData, currentRoute.storeId);
  }, [currentRoute, storesData]);

  const selectedBeer = useMemo(() => {
    if (currentRoute.name !== "beer-details") return undefined;
    return getBeerById(storesData, currentRoute.beerId);
  }, [currentRoute, storesData]);

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
    setRootRoute({ name: "landing" });
    return true;
  }

  function handleUseDemoAccount(userId: string) {
    const user = getUserById(userId);
    if (!user) return;

    setCurrentUser(user);
    setRootRoute({ name: "profile" });
  }

  function handleSignOut() {
    setCurrentUser(null);
    setRootRoute({ name: "login" });
  }

  function handleBuyBeer(beerId: string) {
    if (!currentUser || currentUser.role !== "buyer") return;

    const beer = getBeerById(storesData, beerId);
    if (!beer) return;

    setOrders((prev) => [
      {
        id: `order-${Date.now()}`,
        buyerId: currentUser.id,
        storeId: beer.storeId,
        items: [{ beerId, quantity: 1 }],
        total: beer.price,
        createdAt: "Agora",
        eta: "30-40 min",
        status: "Em preparo",
      },
      ...prev,
    ]);

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
        onBuyBeer={handleBuyBeer}
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
