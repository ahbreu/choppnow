import { useMemo, useState } from "react";
import { getBeerById, getStoreById } from "./src/data/stores";
import { getTheme, ThemeMode } from "./src/global/themes";
import BeerDetails from "./src/pages/beer-details";
import Catalog, { CatalogMode } from "./src/pages/catalog";
import Landing from "./src/pages/landing";
import Login from "./src/pages/login";
import StoreDetails from "./src/pages/store-details";

type Route =
  | { name: "login" }
  | { name: "landing" }
  | { name: "catalog"; mode: CatalogMode }
  | { name: "store-details"; storeId: string }
  | { name: "beer-details"; beerId: string };

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([{ name: "login" }]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const currentRoute = routes[routes.length - 1];
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  const selectedStore = useMemo(() => {
    if (currentRoute.name !== "store-details") return undefined;
    return getStoreById(currentRoute.storeId);
  }, [currentRoute]);

  const selectedBeer = useMemo(() => {
    if (currentRoute.name !== "beer-details") return undefined;
    return getBeerById(currentRoute.beerId);
  }, [currentRoute]);

  function navigate(route: Route) {
    setRoutes((prev) => [...prev, route]);
  }

  function resetToLogin() {
    setRoutes([{ name: "login" }]);
  }

  function resetToLanding() {
    setRoutes([{ name: "landing" }]);
  }

  function goBack() {
    setRoutes((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function toggleTheme() {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }

  if (currentRoute.name === "store-details") {
    return (
      <StoreDetails
        store={selectedStore}
        onBack={goBack}
        onRequestLogin={resetToLogin}
        onOpenBeer={(beerId) => navigate({ name: "beer-details", beerId })}
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
        onBack={goBack}
        onRequestLogin={resetToLogin}
        onOpenStore={(storeId) => navigate({ name: "store-details", storeId })}
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
        onBack={goBack}
        onRequestLogin={resetToLogin}
        onOpenStore={(storeId) => navigate({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => navigate({ name: "beer-details", beerId })}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentRoute.name === "landing") {
    return (
      <Landing
        onRequestLogin={resetToLogin}
        onOpenStore={(storeId) => navigate({ name: "store-details", storeId })}
        onOpenBeer={(beerId) => navigate({ name: "beer-details", beerId })}
        onOpenStoreList={() => navigate({ name: "catalog", mode: "stores" })}
        onOpenBeerList={() => navigate({ name: "catalog", mode: "beers" })}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Login
      onContinueAsGuest={resetToLanding}
      theme={theme}
      themeMode={themeMode}
      onToggleTheme={toggleTheme}
    />
  );
}
