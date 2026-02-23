import { useState } from "react";
import Landing from "./src/pages/landing";
import Login from "./src/pages/login";

type Screen = "login" | "landing";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  if (screen === "landing") {
    return <Landing onRequestLogin={() => setScreen("login")} />;
  }

  return <Login onContinueAsGuest={() => setScreen("landing")} />;
}
