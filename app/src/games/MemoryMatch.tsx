/**
 * Memory Match — Game 1
 *
 * Match pairs of familiar household-object pictures.
 * Features:
 *  - Optional preview before play
 *  - Grid size adjusts by difficulty
 *  - Hint reveals one unmatched pair
 *  - Session metrics tracked
 *
 * Spec visual: mint background (#DDF5EE), lavender card backs (#E9E5FF),
 * coral highlights (#FFE5D5), matched cards get green outline.
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps, GameMetrics } from "./Game";
import { SpokenPrompt } from "../components/SpokenPrompt";

// ── Card content — household/familiar objects ──────────────────
const ALL_OBJECTS = [
  { id: "cup",      emoji: "☕", label: "Cup" },
  { id: "apple",    emoji: "🍎", label: "Apple" },
  { id: "flower",   emoji: "🌸", label: "Flower" },
  { id: "book",     emoji: "📚", label: "Book" },
  { id: "cat",      emoji: "🐱", label: "Cat" },
  { id: "house",    emoji: "🏠", label: "House" },
  { id: "bird",     emoji: "🐦", label: "Bird" },
  { id: "sun",      emoji: "☀️", label: "Sun" },
  { id: "banana",   emoji: "🍌", label: "Banana" },
  { id: "fish",     emoji: "🐟", label: "Fish" },
  { id: "tree",     emoji: "🌳", label: "Tree" },
  { id: "clock",    emoji: "🕐", label: "Clock" },
];

interface Card {
  uid: string;        // unique instance id
  objectId: string;
  emoji: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(difficulty: string): Card[] {
  const count = difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4;
  const objects = ALL_OBJECTS.slice(0, count);
  const deck: Card[] = [];
  objects.forEach((obj) => {
    deck.push({ uid: `${obj.id}-a`, objectId: obj.id, emoji: obj.emoji, label: obj.label, flipped: false, matched: false });
    deck.push({ uid: `${obj.id}-b`, objectId: obj.id, emoji: obj.emoji, label: obj.label, flipped: false, matched: false });
  });
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

type Phase = "preview" | "playing";

export default function MemoryMatch({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("preview");
  const [previewTimer, setPreviewTimer] = useState(3);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(false);
  const [locked, setLocked] = useState(false);
  const startTime = useRef(Date.now());
  const attempts = useRef(0);

  // Initialise deck
  useEffect(() => {
    const deck = buildDeck(difficulty);
    setCards(deck.map((c) => ({ ...c, flipped: true }))); // all face-up for preview
    startTime.current = Date.now();
  }, [difficulty]);

  // Preview countdown
  useEffect(() => {
    if (phase !== "preview" || cards.length === 0) return;
    if (previewTimer <= 0) {
      setCards((prev) => prev.map((c) => ({ ...c, flipped: false })));
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setPreviewTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, previewTimer, cards.length]);

  const handleFlip = (card: Card) => {
    if (locked || phase !== "playing" || card.flipped || card.matched) return;
    if (selected.length === 1 && selected[0].uid === card.uid) return;

    const newCard = { ...card, flipped: true };
    const newCards = cards.map((c) => (c.uid === card.uid ? newCard : c));
    setCards(newCards);

    if (selected.length === 0) {
      setSelected([newCard]);
    } else {
      const first = selected[0];
      attempts.current += 1;
      setLocked(true);

      if (first.objectId === newCard.objectId) {
        // Match!
        setCorrect((n) => n + 1);
        setCards((prev) =>
          prev.map((c) =>
            c.objectId === newCard.objectId ? { ...c, matched: true, flipped: true } : c
          )
        );
        setSelected([]);
        setLocked(false);
      } else {
        // No match — flip back after delay
        setIncorrect((n) => n + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uid === first.uid || c.uid === newCard.uid
                ? { ...c, flipped: false }
                : c
            )
          );
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  // Check win condition
  useEffect(() => {
    if (cards.length === 0) return;
    if (cards.every((c) => c.matched)) {
      const metrics: GameMetrics = {
        correct,
        incorrect,
        responseTimeMs: Date.now() - startTime.current,
        hintsUsed,
        gameId: "memory_match",
      };
      onDone(metrics);
    }
  }, [cards, correct, incorrect, hintsUsed, onDone]);

  const handleHint = () => {
    if (hintsUsed || phase !== "playing") return;
    setHintsUsed(true);
    // Reveal first unmatched pair for 1.5s
    const unmatched = cards.filter((c) => !c.matched && !c.flipped);
    if (unmatched.length < 2) return;
    const pairId = unmatched[0].objectId;
    const pair = unmatched.filter((c) => c.objectId === pairId);
    setCards((prev) =>
      prev.map((c) => (pair.some((p) => p.uid === c.uid) ? { ...c, flipped: true } : c))
    );
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) =>
          pair.some((p) => p.uid === c.uid) && !c.matched ? { ...c, flipped: false } : c
        )
      );
    }, 1500);
  };

  const cols = difficulty === "hard" ? 4 : 3;
  const pairsLeft = cards.filter((c) => !c.matched).length / 2;

  return (
    <div
      className="page-wrapper game-memory-match"
      data-testid="memory-match-game"
      style={{ background: "var(--color-surface-page)" }}
    >
      <SpokenPrompt textKey="memory_match_prompt" />

      {/* Status bar */}
      <div className="game-status-bar">
        <span className="game-stat">
          🃏 {Math.round(pairsLeft)} {t("memory_match_pairs_left", { n: Math.round(pairsLeft) }) ?? "pairs left"}
        </span>
        <span className="game-stat">✓ {correct}</span>
        {!hintsUsed && phase === "playing" && (
          <button className="btn-hint" onClick={handleHint} data-testid="hint-btn">
            {t("hint")}
          </button>
        )}
      </div>

      {/* Preview banner */}
      {phase === "preview" && (
        <div className="preview-banner" aria-live="polite">
          🧠 {t("memory_match_preview")} ({previewTimer}s)
        </div>
      )}

      {/* Card grid */}
      <div
        className="memory-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "0.625rem",
          maxWidth: "420px",
          margin: "0 auto",
        }}
        role="list"
        aria-label={t("game_memory_match")}
      >
        {cards.map((card) => (
          <button
            key={card.uid}
            className={`memory-card ${card.flipped ? "flipped" : ""} ${card.matched ? "matched" : ""}`}
            onClick={() => handleFlip(card)}
            disabled={card.matched || locked || phase === "preview"}
            aria-label={card.flipped || card.matched ? card.label : "Card face down"}
            data-testid={`card-${card.uid}`}
            role="listitem"
          >
            {card.flipped || card.matched ? (
              <span className="card-face" aria-hidden="true">{card.emoji}</span>
            ) : (
              <span className="card-back" aria-hidden="true">?</span>
            )}
            {card.matched && <span className="card-matched-indicator" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
