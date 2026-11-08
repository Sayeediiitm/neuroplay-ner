/**
 * GameShell — wraps every game with:
 *   1. Instruction screen
 *   2. Game play screen (lazy loads the actual game component)
 *   3. Completion / results screen
 *   4. Pause overlay
 *
 * Handles session saving to IndexedDB after each game.
 */
import { useState, lazy, Suspense, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps, GameMetrics } from "../games/Game";
import {
  getOrCreateDefaultPatient,
  saveGameSession,
  logEvent,
} from "../db/db";

// Lazy-load each game to keep initial bundle small
const MemoryMatch = lazy(() => import("../games/MemoryMatch"));
const FamiliarObjects = lazy(() => import("../games/FamiliarObjects"));
const StorySequence = lazy(() => import("../games/StorySequence"));
const PatternRecall = lazy(() => import("../games/NeuroGrid")); // NeuroGrid IS pattern recall
const PersonalAlbum = lazy(() => import("../games/PersonalAlbum"));
const MetaMind = lazy(() => import("../games/MetaMind"));
const FingerFlow = lazy(() => import("../games/FingerFlow"));
const FocusLab = lazy(() => import("../games/FocusLab"));
const MemorySprint = lazy(() => import("../games/MemorySprint"));

/** Map game ID → instruction key + component */
const GAME_CONFIG: Record<
  string,
  {
    nameKey: string;
    instructionKey: string;
    emoji: string;
    Component: React.LazyExoticComponent<React.ComponentType<GameProps>>;
  }
> = {
  memory_match: {
    nameKey: "game_memory_match",
    instructionKey: "memory_match_prompt",
    emoji: "🃏",
    Component: MemoryMatch,
  },
  familiar_objects: {
    nameKey: "game_familiar_objects",
    instructionKey: "familiar_objects_prompt",
    emoji: "🍎",
    Component: FamiliarObjects,
  },
  story_sequence: {
    nameKey: "game_story_sequence",
    instructionKey: "story_sequence_prompt",
    emoji: "📖",
    Component: StorySequence,
  },
  pattern_recall: {
    nameKey: "game_pattern_recall",
    instructionKey: "pattern_recall_prompt",
    emoji: "🔲",
    Component: PatternRecall,
  },
  personal_album: {
    nameKey: "game_personal_album",
    instructionKey: "album_title",
    emoji: "📸",
    Component: PersonalAlbum,
  },
  metamind: {
    nameKey: "game_metamind",
    instructionKey: "metamind_prompt",
    emoji: "🤔",
    Component: MetaMind,
  },
  fingerflow: {
    nameKey: "game_fingerflow",
    instructionKey: "fingerflow_prompt",
    emoji: "🖐️",
    Component: FingerFlow,
  },
  focuslab: {
    nameKey: "game_focuslab",
    instructionKey: "focuslab_prompt",
    emoji: "🎯",
    Component: FocusLab,
  },
  memorysprint: {
    nameKey: "game_memorysprint",
    instructionKey: "memorysprint_prompt",
    emoji: "⚡",
    Component: MemorySprint,
  },
};

type Phase = "instructions" | "playing" | "paused" | "complete";

interface GameShellProps {
  gameId: string;
  difficulty: string;
  onBack: () => void;
}

export function GameShell({ gameId, difficulty, onBack }: GameShellProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("instructions");
  const [metrics, setMetrics] = useState<GameMetrics | null>(null);
  const [patientId, setPatientId] = useState<string>("unknown");
  const startedAtRef = useRef<string>(new Date().toISOString());

  const config = GAME_CONFIG[gameId];

  useEffect(() => {
    getOrCreateDefaultPatient().then((p) => {
      setPatientId(p.id);
      logEvent("game_started", p.id, { gameId, difficulty });
    });
  }, [gameId, difficulty]);

  async function handleGameDone(m: GameMetrics) {
    setMetrics(m);
    setPhase("complete");
    await saveGameSession(
      patientId,
      gameId,
      startedAtRef.current,
      {
        correct: m.correct,
        incorrect: m.incorrect,
        responseTimeMs: m.responseTimeMs,
        hintsUsed: m.hintsUsed,
      },
      true,
      difficulty
    );
  }

  async function handleAbandon() {
    if (metrics) return; // already done
    await saveGameSession(
      patientId,
      gameId,
      startedAtRef.current,
      { abandoned: true },
      false,
      difficulty
    );
    onBack();
  }

  function handleRetry() {
    startedAtRef.current = new Date().toISOString();
    setMetrics(null);
    setPhase("instructions");
  }

  if (!config) {
    return (
      <div className="page-wrapper">
        <p>Unknown game: {gameId}</p>
        <button className="btn-secondary" onClick={onBack}>{t("back")}</button>
      </div>
    );
  }

  const { nameKey, instructionKey, emoji, Component } = config;

  // ── Instructions ──────────────────────────────────────────────
  if (phase === "instructions") {
    return (
      <div className="page-wrapper game-instructions" data-testid="game-instructions">
        <header className="app-bar">
          <button className="btn-secondary btn-back" onClick={handleAbandon} aria-label={t("back")}>
            ←
          </button>
          <h1 className="page-title">{emoji} {t(nameKey)}</h1>
          <div style={{ width: "56px" }} />
        </header>

        <div className="instructions-card">
          <div className="instructions-emoji" aria-hidden="true">{emoji}</div>
          <h2 className="instructions-heading">{t("how_to_play") ?? "How to Play"}</h2>
          <p className="instructions-text">{t(instructionKey)}</p>
        </div>

        <div className="instructions-actions">
          <button
            className="btn-primary btn-start"
            onClick={() => {
              startedAtRef.current = new Date().toISOString();
              setPhase("playing");
            }}
            data-testid="btn-start-game"
          >
            {t("start_game")} 🚀
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────
  if (phase === "playing" || phase === "paused") {
    return (
      <div style={{ position: "relative" }}>
        <Suspense
          fallback={
            <div className="page-wrapper" style={{ textAlign: "center", paddingTop: "4rem" }}>
              <div className="loading-spinner" aria-label={t("loading")} />
              <p>{t("loading")}</p>
            </div>
          }
        >
          <Component
            difficulty={difficulty}
            onDone={handleGameDone}
            onBack={handleAbandon}
          />
        </Suspense>

        {phase === "paused" && (
          <div className="pause-overlay" role="dialog" aria-label="Paused">
            <div className="pause-card">
              <h2>⏸️ Paused</h2>
              <button className="btn-primary" onClick={() => setPhase("playing")}>
                ▶ Resume
              </button>
              <button className="btn-secondary" style={{ marginTop: "0.75rem" }} onClick={handleAbandon}>
                {t("back_home")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Completion ────────────────────────────────────────────────
  if (phase === "complete" && metrics) {
    const accuracy =
      metrics.correct + metrics.incorrect > 0
        ? Math.round((metrics.correct / (metrics.correct + metrics.incorrect)) * 100)
        : 0;
    const timeSec = Math.round(metrics.responseTimeMs / 1000);

    return (
      <div className="page-wrapper game-complete" data-testid="game-complete">
        <div className="complete-header">
          <div className="complete-emoji" aria-hidden="true">🎉</div>
          <h1 className="complete-title">{t("well_done")}</h1>
          <p className="complete-subtitle">{emoji} {t(nameKey)}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">{t("progress_accuracy")}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{metrics.correct}</span>
            <span className="stat-label">Correct</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{timeSec}s</span>
            <span className="stat-label">Time</span>
          </div>
          {metrics.hintsUsed && (
            <div className="stat-card stat-hint">
              <span className="stat-value">💡</span>
              <span className="stat-label">Hint used</span>
            </div>
          )}
        </div>

        <div className="complete-actions">
          <button className="btn-primary" onClick={handleRetry} data-testid="btn-retry">
            {t("retry")}
          </button>
          <button className="btn-secondary" onClick={onBack} data-testid="btn-back-home" style={{ marginTop: "0.75rem" }}>
            {t("back_home")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
