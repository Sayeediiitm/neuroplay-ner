/**
 * FingerFlow — Game 8 (NeuroGym)
 *
 * Finger coordination exercises via touchscreen.
 * Shows a sequence of finger buttons to press in order.
 * Demonstrates the sequence, then the user repeats it.
 *
 * Visual: mint background, large illustrated hand area, coral indicators.
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";

interface Finger {
  id: string;
  label: string;
  emoji: string;
  position: number; // 0=thumb ... 4=pinky
}

const FINGERS: Finger[] = [
  { id: "thumb",  label: "Thumb",  emoji: "👍", position: 0 },
  { id: "index",  label: "Index",  emoji: "☝️", position: 1 },
  { id: "middle", label: "Middle", emoji: "🖕", position: 2 },
  { id: "ring",   label: "Ring",   emoji: "💍", position: 3 },
  { id: "pinky",  label: "Pinky",  emoji: "🤙", position: 4 },
];

function buildSequence(length: number): Finger[] {
  const seq: Finger[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(FINGERS[Math.floor(Math.random() * FINGERS.length)]);
  }
  return seq;
}

type Phase = "watch" | "your_turn" | "feedback_correct" | "feedback_wrong";

export default function FingerFlow({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const seqLength = difficulty === "hard" ? 6 : difficulty === "medium" ? 4 : 3;
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<Finger[]>([]);
  const [phase, setPhase] = useState<Phase>("watch");
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [userPresses, setUserPresses] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [hintsUsed] = useState(false);
  const startTime = useRef(Date.now());
  const totalRounds = difficulty === "hard" ? 7 : 5;

  // Start a new round
  useEffect(() => {
    const seq = buildSequence(seqLength);
    setSequence(seq);
    setPhase("watch");
    setUserPresses([]);
    setActiveIdx(-1);
    startTime.current = Date.now();
  }, [round, seqLength]);

  // Animate sequence display
  useEffect(() => {
    if (phase !== "watch" || sequence.length === 0) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setActiveIdx(i);
        i++;
      } else {
        clearInterval(interval);
        setActiveIdx(-1);
        setTimeout(() => setPhase("your_turn"), 600);
      }
    }, 900);
    return () => clearInterval(interval);
  }, [phase, sequence]);

  const handlePress = (finger: Finger) => {
    if (phase !== "your_turn") return;
    const newPresses = [...userPresses, finger.id];
    setUserPresses(newPresses);

    // Check this press
    const expectedId = sequence[newPresses.length - 1]?.id;
    if (finger.id !== expectedId) {
      // Wrong
      setIncorrect((n) => n + 1);
      setPhase("feedback_wrong");
      return;
    }

    if (newPresses.length === sequence.length) {
      // Completed correctly
      setCorrect((n) => n + 1);
      setPhase("feedback_correct");
    }
  };

  const handleNext = () => {
    const nextRound = round + 1;
    if (nextRound >= totalRounds) {
      onDone({
        correct,
        incorrect,
        responseTimeMs: Date.now() - startTime.current,
        hintsUsed,
        gameId: "fingerflow",
      });
    } else {
      setRound(nextRound);
    }
  };

  return (
    <div
      className="page-wrapper fingerflow-game"
      data-testid="fingerflow-game"
      style={{ background: "#DDF5EE" }}
    >
      <div className="round-indicator">
        Round {round + 1} of {totalRounds} — Sequence: {seqLength} steps
      </div>

      {/* Phase indicator */}
      <div
        className={`phase-banner ${phase.startsWith("feedback") ? (phase === "feedback_correct" ? "correct" : "wrong") : ""}`}
        aria-live="polite"
      >
        {phase === "watch" && `👀 ${t("fingerflow_watch")}`}
        {phase === "your_turn" && `🖐️ ${t("fingerflow_your_turn")}`}
        {phase === "feedback_correct" && `✓ ${t("fingerflow_correct")}`}
        {phase === "feedback_wrong" && `✗ ${t("fingerflow_wrong")}`}
      </div>

      {/* Sequence display during watch phase */}
      {phase === "watch" && (
        <div className="sequence-display" aria-label="Watch this sequence" aria-live="polite">
          {sequence.map((finger, i) => (
            <div
              key={i}
              className={`sequence-step ${activeIdx === i ? "active" : activeIdx > i ? "done" : ""}`}
              aria-hidden="true"
            >
              <span className="seq-emoji">{finger.emoji}</span>
              <span className="seq-label">{finger.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress during your_turn */}
      {(phase === "your_turn" || phase.startsWith("feedback")) && (
        <div className="press-progress" aria-label="Your progress">
          {sequence.map((finger, i) => {
            const pressed = userPresses[i];
            const wasCorrect = pressed && pressed === finger.id;
            const wasWrong = pressed && pressed !== finger.id;
            return (
              <div
                key={i}
                className={`press-slot ${wasCorrect ? "correct" : wasWrong ? "wrong" : i === userPresses.length ? "current" : ""}`}
                aria-label={pressed ? finger.label : `Step ${i + 1}`}
              >
                {pressed
                  ? FINGERS.find((f) => f.id === pressed)?.emoji ?? "?"
                  : i < userPresses.length
                  ? "?"
                  : "○"}
              </div>
            );
          })}
        </div>
      )}

      {/* Finger buttons */}
      {phase === "your_turn" && (
        <div className="finger-buttons" role="group" aria-label="Tap the fingers in sequence">
          {FINGERS.map((finger) => (
            <button
              key={finger.id}
              className="finger-btn"
              onClick={() => handlePress(finger)}
              aria-label={finger.label}
              data-testid={`finger-${finger.id}`}
            >
              <span className="finger-emoji" aria-hidden="true">{finger.emoji}</span>
              <span className="finger-label">{finger.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Feedback action */}
      {phase.startsWith("feedback") && (
        <button
          className="btn-primary"
          onClick={handleNext}
          style={{ marginTop: "1.5rem" }}
          data-testid="btn-next-round"
        >
          {round + 1 >= totalRounds ? "Finish 🎉" : "Next Round →"}
        </button>
      )}

      {/* Score */}
      <div className="score-bar" aria-live="polite">
        ✓ {correct} rounds correct &nbsp; ✗ {incorrect} wrong
      </div>
    </div>
  );
}
