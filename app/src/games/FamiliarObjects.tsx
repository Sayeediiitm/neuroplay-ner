/**
 * Familiar Objects — Game 3
 *
 * Show a spoken prompt ("Find the cup") and display 4 large image options.
 * User taps the matching object.
 * Visual: soft cream background, large cards, deep navy labels, sky-blue selection.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";

interface ObjectItem {
  id: string;
  emoji: string;
  label: string;
  category: string;
}

const OBJECTS: ObjectItem[] = [
  { id: "cup",      emoji: "☕", label: "Cup",      category: "household" },
  { id: "spoon",    emoji: "🥄", label: "Spoon",    category: "household" },
  { id: "plate",    emoji: "🍽️", label: "Plate",    category: "household" },
  { id: "key",      emoji: "🔑", label: "Key",      category: "household" },
  { id: "apple",    emoji: "🍎", label: "Apple",    category: "food" },
  { id: "banana",   emoji: "🍌", label: "Banana",   category: "food" },
  { id: "carrot",   emoji: "🥕", label: "Carrot",   category: "food" },
  { id: "bread",    emoji: "🍞", label: "Bread",    category: "food" },
  { id: "shirt",    emoji: "👕", label: "Shirt",    category: "clothing" },
  { id: "shoes",    emoji: "👟", label: "Shoes",    category: "clothing" },
  { id: "hat",      emoji: "🎩", label: "Hat",      category: "clothing" },
  { id: "glasses",  emoji: "👓", label: "Glasses",  category: "clothing" },
  { id: "dog",      emoji: "🐶", label: "Dog",      category: "animals" },
  { id: "bird",     emoji: "🐦", label: "Bird",     category: "animals" },
  { id: "flower",   emoji: "🌸", label: "Flower",   category: "nature" },
  { id: "tree",     emoji: "🌳", label: "Tree",     category: "nature" },
  { id: "phone",    emoji: "📱", label: "Phone",    category: "household" },
  { id: "book",     emoji: "📚", label: "Book",     category: "household" },
];

function pickRound(usedIds: Set<string>): { target: ObjectItem; distractors: ObjectItem[] } | null {
  const remaining = OBJECTS.filter((o) => !usedIds.has(o.id));
  if (remaining.length === 0) return null;
  const target = remaining[Math.floor(Math.random() * remaining.length)];
  // Pick 3 distractors from other categories
  const others = OBJECTS.filter((o) => o.id !== target.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
  return { target, distractors: shuffled };
}

const ROUNDS = 8;

export default function FamiliarObjects({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<ObjectItem | null>(null);
  const [options, setOptions] = useState<ObjectItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(false);
  const usedIds = useRef<Set<string>>(new Set());
  const startTime = useRef(Date.now());
  const totalRounds = difficulty === "hard" ? ROUNDS : difficulty === "medium" ? 6 : 5;

  const loadRound = useCallback(() => {
    const result = pickRound(usedIds.current);
    if (!result) {
      // All objects exhausted — end game
      onDone({
        correct, incorrect,
        responseTimeMs: Date.now() - startTime.current,
        hintsUsed,
        gameId: "familiar_objects",
      });
      return;
    }
    usedIds.current.add(result.target.id);
    const opts = [...result.distractors, result.target].sort(() => Math.random() - 0.5);
    setTarget(result.target);
    setOptions(opts);
    setSelected(null);
    setFeedback(null);
  }, [correct, incorrect, hintsUsed, onDone]);

  useEffect(() => {
    loadRound();
    startTime.current = Date.now();
  }, [loadRound]);

  const handleSelect = (obj: ObjectItem) => {
    if (selected || !target) return;
    setSelected(obj.id);
    const isCorrect = obj.id === target.id;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setCorrect((n) => n + 1);
    else setIncorrect((n) => n + 1);

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= totalRounds) {
        onDone({
          correct: isCorrect ? correct + 1 : correct,
          incorrect: isCorrect ? incorrect : incorrect + 1,
          responseTimeMs: Date.now() - startTime.current,
          hintsUsed,
          gameId: "familiar_objects",
        });
      } else {
        setRound(nextRound);
        loadRound();
      }
    }, 1200);
  };

  const handleHint = () => {
    if (hintsUsed || !target || selected) return;
    setHintsUsed(true);
    // Highlight 2 wrong answers briefly
    const wrongs = options.filter((o) => o.id !== target.id).slice(0, 2);
    wrongs.forEach((w) => {
      const el = document.getElementById(`obj-${w.id}`);
      if (el) {
        el.style.opacity = "0.3";
        setTimeout(() => { if (el) el.style.opacity = "1"; }, 1200);
      }
    });
  };

  // Speak the target
  useEffect(() => {
    if (target && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Find the ${target.label}`);
      u.lang = "en-IN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }, [target]);

  return (
    <div
      className="page-wrapper game-familiar-objects"
      data-testid="familiar-objects-game"
      style={{ background: "#FFFBEB" }}
    >
      {/* Round indicator */}
      <div className="round-indicator" aria-live="polite">
        Round {round + 1} of {totalRounds}
      </div>

      {/* Target prompt */}
      {target && (
        <div className="find-prompt" aria-live="polite" data-testid="find-prompt">
          <span className="find-verb">{t("familiar_objects_find")}</span>
          <span className="find-target">{target.label}</span>
          <button
            className="speak-btn"
            onClick={() => {
              if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(`Find the ${target.label}`);
                u.lang = "en-IN";
                u.rate = 0.85;
                window.speechSynthesis.speak(u);
              }
            }}
            aria-label={`Hear: Find the ${target.label}`}
          >
            🔈
          </button>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`feedback-banner ${feedback}`}
          aria-live="assertive"
          data-testid="feedback-banner"
        >
          {feedback === "correct" ? t("familiar_objects_correct") : t("familiar_objects_wrong")}
        </div>
      )}

      {/* Options grid */}
      <div
        className="objects-grid"
        role="list"
        aria-label="Choose an object"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          maxWidth: "420px",
          margin: "0 auto",
          padding: "1rem 0",
        }}
      >
        {options.map((obj) => {
          const isSelected = selected === obj.id;
          const isCorrect = isSelected && obj.id === target?.id;
          const isWrong = isSelected && obj.id !== target?.id;
          return (
            <button
              key={obj.id}
              id={`obj-${obj.id}`}
              className={`object-card ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
              onClick={() => handleSelect(obj)}
              disabled={!!selected}
              aria-label={obj.label}
              data-testid={`obj-${obj.id}`}
              role="listitem"
            >
              <span className="object-emoji" aria-hidden="true">{obj.emoji}</span>
              <span className="object-label">{obj.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {!hintsUsed && !selected && (
        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <button className="btn-hint" onClick={handleHint} data-testid="hint-btn">
            {t("hint")}
          </button>
        </div>
      )}

      {/* Score */}
      <div className="score-bar" aria-live="polite">
        ✓ {correct} &nbsp; ✗ {incorrect}
      </div>
    </div>
  );
}
