/**
 * MemorySprint — Game 10 (NeuroGym)
 *
 * Working memory challenge:
 * 1. Show a sequence of colored tiles/numbers
 * 2. Hide it
 * 3. User recreates the sequence by tapping
 * 4. Difficulty increases gradually
 *
 * Visual: lavender cards, mint progress, large numbered tiles, gentle animations.
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";

const COLORS = [
  { id: "red",    color: "#ef4444", label: "Red"    },
  { id: "blue",   color: "#3b82f6", label: "Blue"   },
  { id: "green",  color: "#22c55e", label: "Green"  },
  { id: "yellow", color: "#eab308", label: "Yellow" },
  { id: "purple", color: "#a855f7", label: "Purple" },
  { id: "orange", color: "#f97316", label: "Orange" },
];

function buildSequence(length: number): string[] {
  return Array.from({ length }, () => COLORS[Math.floor(Math.random() * COLORS.length)].id);
}

type Phase = "watch" | "input" | "correct" | "wrong";

export default function MemorySprint({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const baseLength = difficulty === "hard" ? 5 : difficulty === "medium" ? 4 : 3;
  const [level, setLevel] = useState(0);
  const [seqLength, setSeqLength] = useState(baseLength);
  const [sequence, setSequence] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("watch");
  const [showingIdx, setShowingIdx] = useState(-1);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [hintsUsed] = useState(false);
  const [bestLength, setBestLength] = useState(baseLength);
  const startTime = useRef(Date.now());
  const maxRounds = difficulty === "hard" ? 8 : 6;

  // Start a new round
  useEffect(() => {
    const seq = buildSequence(seqLength);
    setSequence(seq);
    setPhase("watch");
    setUserInput([]);
    setShowingIdx(0);
  }, [level, seqLength]);

  // Animate sequence
  useEffect(() => {
    if (phase !== "watch") return;
    if (showingIdx < 0 || showingIdx >= sequence.length) return;

    const timer = setTimeout(() => {
      if (showingIdx + 1 < sequence.length) {
        setShowingIdx(showingIdx + 1);
      } else {
        setShowingIdx(-1);
        setTimeout(() => setPhase("input"), 500);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, showingIdx, sequence]);

  const handleTap = (colorId: string) => {
    if (phase !== "input") return;
    const newInput = [...userInput, colorId];
    setUserInput(newInput);

    const pos = newInput.length - 1;
    if (colorId !== sequence[pos]) {
      // Wrong
      setIncorrect((n) => n + 1);
      setPhase("wrong");
      return;
    }

    if (newInput.length === sequence.length) {
      // Correct!
      setCorrect((n) => n + 1);
      setBestLength((b) => Math.max(b, seqLength));
      setPhase("correct");
    }
  };

  const handleNext = (wasCorrect: boolean) => {
    const nextLevel = level + 1;
    if (nextLevel >= maxRounds) {
      onDone({
        correct,
        incorrect,
        responseTimeMs: Date.now() - startTime.current,
        hintsUsed,
        gameId: "memorysprint",
      });
      return;
    }
    setLevel(nextLevel);
    // Increase length only on correct
    if (wasCorrect) setSeqLength((l) => Math.min(l + 1, 9));
    else setSeqLength(Math.max(baseLength, seqLength - 1));
  };

  const currentActiveColor = phase === "watch" && showingIdx >= 0
    ? sequence[showingIdx]
    : null;

  return (
    <div
      className="page-wrapper memorysprint-game"
      data-testid="memorysprint-game"
      style={{ background: "#F0ECFF" }}
    >
      {/* Level / progress */}
      <div className="round-indicator">
        Level {level + 1} of {maxRounds} — Sequence: {seqLength} items
      </div>

      {/* Phase banner */}
      <div
        className={`phase-banner ${phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : ""}`}
        aria-live="polite"
      >
        {phase === "watch" && `👀 ${t("memorysprint_watch")}`}
        {phase === "input" && `🖱️ ${t("memorysprint_go")}`}
        {phase === "correct" && `✓ ${t("memorysprint_correct")}`}
        {phase === "wrong" && `✗ ${t("memorysprint_wrong")}`}
      </div>

      {/* Sequence display (watch phase) */}
      {phase === "watch" && (
        <div className="sequence-watch" aria-label="Watch the sequence" aria-live="polite">
          {sequence.map((colorId, i) => {
            const color = COLORS.find((c) => c.id === colorId)!;
            return (
              <div
                key={i}
                className={`watch-tile ${showingIdx === i ? "active" : ""}`}
                aria-hidden="true"
                style={{
                  background: showingIdx === i ? color.color : "#e5e7eb",
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  transition: "background 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  color: "#fff",
                  margin: "0 4px",
                }}
              >
                {showingIdx === i ? i + 1 : ""}
              </div>
            );
          })}
        </div>
      )}

      {/* User input progress */}
      {phase === "input" && (
        <div className="input-progress" aria-label="Your input so far">
          {sequence.map((_, i) => {
            const typed = userInput[i];
            const typedColor = typed ? COLORS.find((c) => c.id === typed) : null;
            return (
              <div
                key={i}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: typedColor ? typedColor.color : "#e5e7eb",
                  border: i === userInput.length ? "3px solid var(--color-brand-primary)" : "3px solid transparent",
                  display: "inline-flex",
                  margin: "0 4px",
                  transition: "background 0.2s ease",
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      )}

      {/* Color pad */}
      {(phase === "input") && (
        <div
          className="color-pad"
          role="group"
          aria-label="Tap the colors in the same order"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem",
            maxWidth: "320px",
            margin: "1.5rem auto 0",
          }}
        >
          {COLORS.map((color) => (
            <button
              key={color.id}
              className={`color-tile ${currentActiveColor === color.id ? "active" : ""}`}
              onClick={() => handleTap(color.id)}
              aria-label={color.label}
              data-testid={`color-${color.id}`}
              style={{
                background: color.color,
                height: "72px",
                borderRadius: "14px",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                transform: "scale(1)",
                transition: "transform 80ms",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              {color.label}
            </button>
          ))}
        </div>
      )}

      {/* Feedback actions */}
      {(phase === "correct" || phase === "wrong") && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          {phase === "wrong" && (
            <p className="correct-sequence-label">
              Correct sequence: {sequence.map((id) => COLORS.find((c) => c.id === id)?.label).join(" → ")}
            </p>
          )}
          <button
            className="btn-primary"
            onClick={() => handleNext(phase === "correct")}
            data-testid="btn-next"
          >
            {level + 1 >= maxRounds ? "Finish 🎉" : "Next →"}
          </button>
        </div>
      )}

      {/* Score */}
      <div className="score-bar" aria-live="polite">
        ✓ {correct} | ✗ {incorrect} | Best: {bestLength} items
      </div>
    </div>
  );
}
