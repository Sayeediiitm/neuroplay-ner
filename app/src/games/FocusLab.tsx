/**
 * FocusLab — Game 9 (NeuroGym)
 *
 * Selective attention game:
 * 1. Show a target shape/color
 * 2. Rapidly display shapes — tap only the target
 * 3. Score: correct taps (hits), missed targets, false positives (wrong taps)
 *
 * Visual: sky-blue panels, high-contrast geometric shapes.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";

interface Shape {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

const SHAPES: Shape[] = [
  { id: "circle",   emoji: "⭕", label: "Circle",   color: "#ef4444" },
  { id: "square",   emoji: "⬛", label: "Square",   color: "#1d4ed8" },
  { id: "triangle", emoji: "🔺", label: "Triangle", color: "#f59e0b" },
  { id: "star",     emoji: "⭐", label: "Star",     color: "#7c3aed" },
  { id: "diamond",  emoji: "🔷", label: "Diamond",  color: "#0891b2" },
];

interface DisplayItem {
  id: string;
  shape: Shape;
  isTarget: boolean;
  tapped: boolean;
  missed: boolean;
}

const ITEM_DURATION_MS = 1500; // ms each item is shown

export default function FocusLab({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const [target] = useState(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [currentItemIdx, setCurrentItemIdx] = useState(-1);
  const [gamePhase, setGamePhase] = useState<"ready" | "playing" | "complete">("ready");
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falsePositives, setFalsePositives] = useState(0);
  const [hintsUsed] = useState(false);
  const startTime = useRef(Date.now());
  const itemTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = difficulty === "hard" ? 15 : difficulty === "medium" ? 12 : 10;
  // ~40% targets
  const targetCount = Math.max(3, Math.floor(totalItems * 0.4));

  // Build the item sequence
  const buildItems = useCallback(() => {
    const arr: DisplayItem[] = [];
    const targetIndices = new Set<number>();
    while (targetIndices.size < targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalItems));
    }
    for (let i = 0; i < totalItems; i++) {
      const isTarget = targetIndices.has(i);
      const shapePool = isTarget ? [target] : SHAPES.filter((s) => s.id !== target.id);
      const shape = shapePool[Math.floor(Math.random() * shapePool.length)];
      arr.push({
        id: `item-${i}`,
        shape,
        isTarget,
        tapped: false,
        missed: false,
      });
    }
    return arr;
  }, [target, targetCount, totalItems]);

  const startGame = () => {
    const newItems = buildItems();
    setItems(newItems);
    setCurrentItemIdx(0);
    setGamePhase("playing");
    setHits(0); setMisses(0); setFalsePositives(0);
    startTime.current = Date.now();
  };

  // Advance through items
  useEffect(() => {
    if (gamePhase !== "playing") return;
    if (currentItemIdx < 0 || currentItemIdx >= items.length) return;

    itemTimer.current = setTimeout(() => {
      // Mark as missed if target and not tapped
      setItems((prev) =>
        prev.map((item, i) =>
          i === currentItemIdx && item.isTarget && !item.tapped
            ? { ...item, missed: true }
            : item
        )
      );
      if (items[currentItemIdx]?.isTarget && !items[currentItemIdx]?.tapped) {
        setMisses((n) => n + 1);
      }
      const next = currentItemIdx + 1;
      if (next >= items.length) {
        setGamePhase("complete");
      } else {
        setCurrentItemIdx(next);
      }
    }, ITEM_DURATION_MS);

    return () => { if (itemTimer.current) clearTimeout(itemTimer.current); };
  }, [currentItemIdx, gamePhase, items]);

  const handleTap = () => {
    if (gamePhase !== "playing" || currentItemIdx < 0) return;
    const item = items[currentItemIdx];
    if (!item || item.tapped) return;

    if (itemTimer.current) clearTimeout(itemTimer.current);

    if (item.isTarget) {
      setHits((n) => n + 1);
      setItems((prev) =>
        prev.map((it, i) => (i === currentItemIdx ? { ...it, tapped: true } : it))
      );
    } else {
      setFalsePositives((n) => n + 1);
      setItems((prev) =>
        prev.map((it, i) => (i === currentItemIdx ? { ...it, tapped: true } : it))
      );
    }

    // Advance to next
    const next = currentItemIdx + 1;
    if (next >= items.length) {
      setGamePhase("complete");
    } else {
      setCurrentItemIdx(next);
    }
  };

  if (gamePhase === "complete") {
    const accuracy = targetCount > 0 ? Math.round((hits / targetCount) * 100) : 0;
    return (
      <div className="page-wrapper focuslab-complete" data-testid="focuslab-complete" style={{ background: "#DCEAFE" }}>
        <div className="complete-header">
          <div className="complete-emoji">🎯</div>
          <h1>{t("focuslab_complete")}</h1>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-value">{hits}</span><span className="stat-label">Targets hit</span></div>
          <div className="stat-card"><span className="stat-value">{misses}</span><span className="stat-label">Missed</span></div>
          <div className="stat-card"><span className="stat-value">{falsePositives}</span><span className="stat-label">False taps</span></div>
          <div className="stat-card"><span className="stat-value">{accuracy}%</span><span className="stat-label">Hit rate</span></div>
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: "1.5rem" }}
          onClick={() =>
            onDone({
              correct: hits,
              incorrect: misses + falsePositives,
              responseTimeMs: Date.now() - startTime.current,
              hintsUsed,
              gameId: "focuslab",
            })
          }
          data-testid="btn-done"
        >
          Done 🎉
        </button>
      </div>
    );
  }

  const currentItem = currentItemIdx >= 0 ? items[currentItemIdx] : null;

  return (
    <div
      className="page-wrapper focuslab-game"
      data-testid="focuslab-game"
      style={{ background: "#DCEAFE" }}
    >
      {/* Target indicator */}
      <div className="target-info" aria-label={`Your target: ${target.label}`}>
        <span className="target-label-text">{t("focuslab_target", { shape: target.label })}</span>
        <span className="target-shape" aria-hidden="true" style={{ fontSize: "2rem" }}>{target.emoji}</span>
      </div>

      {/* Ready screen */}
      {gamePhase === "ready" && (
        <div className="ready-screen" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>
            {t("focuslab_prompt")}
          </p>
          <div className="target-demo" aria-hidden="true" style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
            {target.emoji}
          </div>
          <button className="btn-primary" onClick={startGame} data-testid="btn-start">
            {t("start_game")} 🚀
          </button>
        </div>
      )}

      {/* Playing */}
      {gamePhase === "playing" && currentItem && (
        <>
          <div className="item-counter" aria-label={`Item ${currentItemIdx + 1} of ${totalItems}`}>
            {currentItemIdx + 1} / {totalItems}
          </div>

          <div className="item-display-area">
            <button
              className="display-shape-btn"
              onClick={handleTap}
              aria-label={`Tap if this is ${target.label}`}
              data-testid="shape-display"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <span className="display-shape" aria-hidden="true" style={{ fontSize: "6rem" }}>
                {currentItem.shape.emoji}
              </span>
            </button>
          </div>

          <div
            className="focuslab-progress-track"
            role="progressbar"
            aria-valuenow={currentItemIdx}
            aria-valuemax={totalItems}
            style={{
              width: "100%",
              height: "8px",
              background: "#c7d7f9",
              borderRadius: "4px",
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                width: `${(currentItemIdx / totalItems) * 100}%`,
                height: "100%",
                background: "var(--color-brand-primary)",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div className="score-bar" aria-live="polite">
            🎯 Hits: {hits} &nbsp; ✗ Missed: {misses} &nbsp; ⚠️ False: {falsePositives}
          </div>
        </>
      )}
    </div>
  );
}
