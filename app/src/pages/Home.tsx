/**
 * Home screen — NeuroPlay NER landing page
 *
 * Two main sections:
 *   1. Memory & Daily Living (for elderly / dementia support)
 *   2. NeuroGym (for healthy users — cognitive wellness)
 *
 * Plus quick access: Reminders, Family Album, Progress
 *
 * Elderly UI rules:
 *   - Large touch targets (≥56px)
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
import type { Screen } from "../App";

function getGreeting(): "greeting_morning" | "greeting_afternoon" | "greeting_evening" {
  const h = new Date().getHours();
  if (h < 12) return "greeting_morning";
  if (h < 17) return "greeting_afternoon";
  return "greeting_evening";
}

interface HomeProps {
  onNavigate: (to: Screen) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const { t, i18n } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    getOrCreateDefaultPatient().then(async (p) => {
      setPatient(p);
      await logEvent("home_viewed", p.id);
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

  async function handleTileTap(to: Screen) {
    if (patient && typeof to === "string") {
      await logEvent("tile_tapped", patient.id, { tile: to });
    }
    onNavigate(to);
  }

  return (
    <div className="page-wrapper home-page" data-testid="home-screen">
      <OfflineBanner />

      {/* App bar */}
      <header className="app-bar">
        <div className="app-logo-group">
          <span className="app-logo-icon" aria-hidden="true">🧠</span>
          <span className="app-logo-text">NeuroPlay</span>
        </div>
        <div className="app-bar-right">
          {patient && (
            <LanguageSwitcher patientId={patient.id} aria-label="Language" />
          )}
          <button
            className="progress-btn"
            onClick={() => handleTileTap("progress")}
            aria-label="Progress"
            data-testid="btn-progress"
          >
            📊
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div className="greeting-row">
        <p className="greeting" data-testid="greeting">
          {t(getGreeting())}{patient?.alias && ` • ${patient.alias}`}
        </p>
        {streak > 1 && (
          <span className="streak-badge">🔥 {streak}</span>
        )}
      </div>

      {/* Audio prompt */}
      <AudioPrompt
        textKey="screen_home_audio"
        lang={speechLang}
        limited={isLimited}
      />

      {/* Section 1: Memory & Daily Living */}
      <section className="home-section" aria-labelledby="section-memory">
        <h2 id="section-memory" className="section-title">
          <span className="section-emoji">🌿</span>
          {t("section_memory_support")}
        </h2>
        <p className="section-desc">{t("section_memory_support_sub")}</p>
        <div className="tile-grid" role="navigation" aria-label={t("section_memory_support")}>
          <button
            className="tile-card tile-memory"
            onClick={() => handleTileTap("memory_support")}
            aria-label={t("tile_play")}
            data-testid="tile-play"
          >
            <span className="tile-icon" aria-hidden="true">🎮</span>
            <span className="tile-label">{t("tile_play")}</span>
            <span className="tile-sublabel">{t("tile_play_sub")}</span>
          </button>
          <button
            className="tile-card tile-remind"
            onClick={() => handleTileTap("reminders")}
            aria-label={t("tile_reminders")}
            data-testid="tile-reminders"
          >
            <span className="tile-icon" aria-hidden="true">⏰</span>
            <span className="tile-label">{t("tile_reminders")}</span>
            <span className="tile-sublabel">{t("tile_reminders_sub")}</span>
          </button>
          <button
            className="tile-card tile-family"
            onClick={() => handleTileTap("family")}
            aria-label={t("tile_family")}
            data-testid="tile-family"
          >
            <span className="tile-icon" aria-hidden="true">👨‍👩‍👧‍👦</span>
            <span className="tile-label">{t("tile_family")}</span>
            <span className="tile-sublabel">{t("tile_family_sub")}</span>
          </button>
          <button
            className="tile-card tile-myday"
            onClick={() => handleTileTap("myday")}
            aria-label={t("tile_myday")}
            data-testid="tile-myday"
          >
            <span className="tile-icon" aria-hidden="true">📅</span>
            <span className="tile-label">{t("tile_myday")}</span>
            <span className="tile-sublabel">{t("tile_myday_sub")}</span>
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" aria-hidden="true" />

      {/* Section 2: NeuroGym */}
      <section className="home-section" aria-labelledby="section-neurogym">
        <h2 id="section-neurogym" className="section-title">
          <span className="section-emoji">💪</span>
          {t("section_neurogym")}
        </h2>
        <p className="section-desc">{t("section_neurogym_sub")}</p>
        <button
          className="neurogym-btn"
          onClick={() => handleTileTap("neurogym")}
          aria-label={t("tile_neurogym")}
          data-testid="tile-neurogym"
        >
          <span className="neurogym-icon" aria-hidden="true">🧬</span>
          <div className="neurogym-text">
            <span className="neurogym-label">{t("tile_neurogym")}</span>
            <span className="neurogym-sublabel">{t("tile_neurogym_sub")}</span>
          </div>
          <span className="neurogym-arrow" aria-hidden="true">→</span>
        </button>
      </section>

      {/* Encouraging message */}
      <div className="encourage-badge" aria-live="polite">
        {streak > 1
          ? t("encourage_streak", { n: streak })
          : t("encourage_welcome")}
      </div>
    </div>
  );
}
