/**
 * Root App component — handles top-level routing for Part 1.
 * Uses a simple state-machine router (no react-router dependency yet).
 * Screens: Home | Play | Reminders | Family
 */
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { Home } from "./pages/Home";
import { Placeholder } from "./pages/Placeholder";

type Screen = "home" | "play" | "reminders" | "family";

function App() {
  const { t } = useTranslation();
  // Simple in-memory router — good enough for Part 1
  const [screen, setScreen] = useState<Screen>("home");

  function navigate(to: string) {
    setScreen(to as Screen);
  }

  function goHome() {
    setScreen("home");
  }

  return (
    <Suspense fallback={<div style={{ padding: "2rem", fontSize: "1.25rem" }}>{t("loading")}</div>}>
      {screen === "home" && <Home onNavigate={navigate} />}
      {screen === "play" && (
        <Placeholder titleKey="tile_play" icon="🎮" onBack={goHome} />
      )}
      {screen === "reminders" && (
        <Placeholder titleKey="tile_reminders" icon="⏰" onBack={goHome} />
      )}
      {screen === "family" && (
        <Placeholder titleKey="tile_family" icon="👨‍👩‍👧‍👦" onBack={goHome} />
      )}
    </Suspense>
  );
}

export default App;
