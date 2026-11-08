/**
 * Root App component — handles top-level routing for NeuroPlay NER.
 * Uses a simple state-machine router (no react-router dependency yet).
 *
 * Screens:
 *   home             — landing screen with two sections
 *   memory_support   — dementia-support game library
 *   neurogym         — healthy-user cognitive wellness
 *   game:{id}        — individual game
 *   reminders        — Reminders / My Day
 *   family           — Personal Memory Album
 *   progress         — Progress Dashboard
 */
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { Home } from "./pages/Home";
import { GameLibrary } from "./pages/GameLibrary";
import { GameShell } from "./pages/GameShell";
import Reminders from "./pages/Reminders";
import FamilyMemory from "./pages/FamilyMemory";
import MyDay from "./pages/MyDay";
import Progress from "./pages/Progress";

export type Screen =
  | "home"
  | "memory_support"
  | "neurogym"
  | { game: string; difficulty?: string }
  | "reminders"
  | "family"
  | "myday"
  | "progress";

function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("home");

  function navigate(to: Screen) {
    setScreen(to);
  }

  function goHome() {
    setScreen("home");
  }

  function renderScreen() {
    if (screen === "home") {
      return <Home onNavigate={navigate} />;
    }
    if (screen === "memory_support") {
      return (
        <GameLibrary
          section="memory_support"
          onSelectGame={(gameId) => navigate({ game: gameId })}
          onBack={goHome}
        />
      );
    }
    if (screen === "neurogym") {
      return (
        <GameLibrary
          section="neurogym"
          onSelectGame={(gameId) => navigate({ game: gameId })}
          onBack={goHome}
        />
      );
    }
    if (typeof screen === "object" && "game" in screen) {
      return (
        <GameShell
          gameId={screen.game}
          difficulty={screen.difficulty ?? "easy"}
          onBack={() => {
            // Go back to the section that has this game
            const neurGymGames = ["metamind", "fingerflow", "focuslab", "memorysprint"];
            if (neurGymGames.includes(screen.game)) {
              navigate("neurogym");
            } else {
              navigate("memory_support");
            }
          }}
        />
      );
    }
    if (screen === "reminders") {
      return <Reminders onBack={goHome} />;
    }
    if (screen === "family") {
      return <FamilyMemory onBack={goHome} />;
    }
    if (screen === "myday") {
      return <MyDay onBack={goHome} />;
    }
    if (screen === "progress") {
      return <Progress onBack={goHome} />;
    }
    return <Home onNavigate={navigate} />;
  }

  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", fontSize: "1.25rem", textAlign: "center" }}>
          {t("loading")}
        </div>
      }
    >
      {renderScreen()}
    </Suspense>
  );
}

export default App;
