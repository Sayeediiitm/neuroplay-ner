/**
 * Home screen — Patient Shell (P2 in screen list)
 *
 * Elderly UI rules applied:
 *   - 3 tiles only (Play, Reminders, Family)
 *   - Touch targets >= 56px (enforced in design-system.css)
 *   - Audio prompt on every screen
 *   - Language switcher accessible from home
 *   - High-contrast, large font
 *   - Works at 360px width
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AudioPrompt } from "../components/AudioPrompt";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { OfflineBanner } from "../components/OfflineBanner";
import { db, logEvent, getOrCreateDefaultPatient, type Patient } from "../db/db";
import { SUPPORTED_LANGUAGES } from "../i18n";

function getGreeting(): "greeting_morning" | "greeting_afternoon" | "greeting_evening" {
  const h = new Date().getHours();
  if (h < 12) return "greeting_morning";
  if (h < 17) return "greeting_afternoon";
  return "greeting_evening";
}

type TileId = "play" | "reminders" | "family";

const TILES: { id: TileId; icon: string; labelKey: string; subKey: string; variant: string }[] = [
  { id: "play",      icon: "🎮", labelKey: "tile_play",      subKey: "tile_play_sub",      variant: "tile-play" },
  { id: "reminders", icon: "⏰", labelKey: "tile_reminders", subKey: "tile_reminders_sub", variant: "tile-remind" },
  { id: "family",    icon: "👨‍👩‍👧‍👦", labelKey: "tile_family",    subKey: "tile_family_sub",    variant: "tile-family" },
];

interface HomeProps {
  onNavigate: (to: TileId) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { t, i18n } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [streak, setStreak] = useState(0);

  // Load or create patient on mount
  useEffect(() => {
    getOrCreateDefaultPatient().then(async (p) => {
      setPatient(p);
      await logEvent("home_viewed", p.id);
      // Compute streak: count distinct days with at least one game_completed event
      const sessions = await db.game_sessions
        .where("patientId")
        .equals(p.id)
        .filter((s) => s.completed === 1)
        .toArray();
      const days = new Set(sessions.map((s) => s.startedAt.slice(0, 10)));
      setStreak(days.size);
    });
  }, []);

  const currentLang = i18n.language;
  const speechLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.speechLang ?? "en-IN";
  const isLimited =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.audioLimited === true;

  // Audio prompt key — fall back to screen_home_audio
  const audioKey = "screen_home_audio";

  async function handleTileTap(id: TileId) {
    if (patient) {
      await logEvent("tile_tapped", patient.id, { tile: id });
    }
    onNavigate(id);
  }

  return (
    <div className="page-wrapper" data-testid="home-screen">
      <OfflineBanner />

      {/* App bar */}
      <header className="app-bar">
        <span className="app-logo" aria-label="NeuroPlay NER">🧠 NeuroPlay</span>
        {patient && (
          <LanguageSwitcher
            patientId={patient.id}
            aria-label="Language"
          />
        )}
      </header>

      {/* Greeting */}
      <p className="greeting" data-testid="greeting">
        {t(getGreeting())} {patient?.alias && `• ${patient.alias}`}
      </p>

      {/* Audio prompt */}
      <AudioPrompt
        textKey={audioKey}
        lang={speechLang}
        limited={isLimited}
      />

      {/* Tiles — max 3 per the elderly UI rule */}
      <div className="tile-grid" role="navigation" aria-label="Main menu">
        {TILES.map((tile) => (
          <button
            key={tile.id}
            className={`tile-card ${tile.variant}`}
            onClick={() => handleTileTap(tile.id)}
            aria-label={t(tile.labelKey)}
            data-testid={`tile-${tile.id}`}
          >
            <span className="tile-icon" aria-hidden="true">{tile.icon}</span>
            <span className="tile-label">{t(tile.labelKey)}</span>
            <span className="tile-sublabel">{t(tile.subKey)}</span>
          </button>
        ))}
      </div>

      {/* Encouraging message */}
      <div className="encourage-badge" aria-live="polite">
        {streak > 1
          ? t("encourage_streak", { n: streak })
          : t("encourage_welcome")}
      </div>
    </div>
  );
}
