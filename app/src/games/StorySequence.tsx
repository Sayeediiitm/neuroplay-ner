/**
 * Story Sequence — Game 2
 *
 * Display 3–5 illustrated story cards (everyday activities).
 * User taps to select, then taps a position to place.
 * After submission, show the correct sequence with explanation.
 *
 * Visual: warm cream background, sky-blue position markers, coral selection indicators.
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";
import { SpokenPrompt } from "../components/SpokenPrompt";

interface StoryStep {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

interface Story {
  id: string;
  title: string;
  steps: StoryStep[];
  explanation: string;
}

const STORIES: Story[] = [
  {
    id: "morning",
    title: "Morning Routine",
    explanation: "We wake up, wash our face, then eat breakfast!",
    steps: [
      { id: "wake",      emoji: "😴", label: "Wake up",        description: "Getting out of bed" },
      { id: "wash",      emoji: "🚿", label: "Wash face",      description: "Washing in the bathroom" },
      { id: "breakfast", emoji: "🍳", label: "Eat breakfast",  description: "Having morning meal" },
    ],
  },
  {
    id: "cooking",
    title: "Making Tea",
    explanation: "First we boil water, add tea leaves, then pour it in the cup!",
    steps: [
      { id: "boil",  emoji: "🫖", label: "Boil water", description: "Heating water" },
      { id: "add",   emoji: "🌿", label: "Add leaves",  description: "Adding tea" },
      { id: "pour",  emoji: "☕", label: "Pour tea",   description: "In the cup" },
    ],
  },
  {
    id: "gardening",
    title: "Gardening",
    explanation: "We dig the soil, plant the seed, then water it to help it grow!",
    steps: [
      { id: "dig",   emoji: "🪣", label: "Dig soil",   description: "Preparing the earth" },
      { id: "plant", emoji: "🌱", label: "Plant seed",  description: "Putting seed in ground" },
      { id: "water", emoji: "💧", label: "Water plant", description: "Giving it water" },
    ],
  },
  {
    id: "shopping",
    title: "Going Shopping",
    explanation: "Make a list, go to market, then pay for your items!",
    steps: [
      { id: "list",  emoji: "📝", label: "Make list",   description: "Writing what you need" },
      { id: "shop",  emoji: "🛒", label: "Go to shop",  description: "At the market" },
      { id: "pay",   emoji: "💰", label: "Pay",         description: "Buying items" },
    ],
  },
];

function pickStory(used: Set<string>): Story | null {
  const remaining = STORIES.filter((s) => !used.has(s.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkOrder(placed: StoryStep[], story: Story): boolean {
  return placed.every((step, i) => step.id === story.steps[i].id);
}

export default function StorySequence({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const [story, setStory] = useState<Story | null>(null);
  const [shuffled, setShuffled] = useState<StoryStep[]>([]);
  const [placed, setPlaced] = useState<(StoryStep | null)[]>([]);
  const [selectedCard, setSelectedCard] = useState<StoryStep | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(false);
  const usedStories = useState(() => new Set<string>())[0];
  const startTime = useState(Date.now())[0];
  const totalRounds = difficulty === "hard" ? 4 : 3;

  const loadNextStory = () => {
    const s = pickStory(usedStories);
    if (!s) {
      onDone({ correct, incorrect, responseTimeMs: Date.now() - startTime, hintsUsed, gameId: "story_sequence" });
      return;
    }
    usedStories.add(s.id);
    setStory(s);
    setShuffled(shuffleArray(s.steps));
    setPlaced(new Array(s.steps.length).fill(null));
    setSelectedCard(null);
    setSubmitted(false);
    setIsCorrect(false);
  };

  useEffect(() => {
    loadNextStory();
  }, []);

  const handleCardSelect = (step: StoryStep) => {
    if (submitted) return;
    // If already placed, don't re-select
    if (placed.some((p) => p?.id === step.id)) return;
    setSelectedCard(step);
  };

  const handlePlaceSlot = (slotIndex: number) => {
    if (!selectedCard || submitted) return;
    // If slot is already occupied, swap
    const newPlaced = [...placed];
    const prevInSlot = newPlaced[slotIndex];
    newPlaced[slotIndex] = selectedCard;
    setPlaced(newPlaced);
    setSelectedCard(prevInSlot); // either null or the prev card (put it back)
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (submitted) return;
    const card = placed[slotIndex];
    if (!card) return;
    setSelectedCard(card);
    setPlaced((prev) => prev.map((p, i) => (i === slotIndex ? null : p)));
  };

  const handleSubmit = () => {
    if (!story) return;
    const completePlaced = placed.filter(Boolean) as StoryStep[];
    if (completePlaced.length < story.steps.length) return;
    const ok = checkOrder(completePlaced, story);
    setIsCorrect(ok);
    setSubmitted(true);
    if (ok) setCorrect((n) => n + 1);
    else setIncorrect((n) => n + 1);
  };

  const handleHint = () => {
    if (!story || hintsUsed || submitted) return;
    setHintsUsed(true);
    // Place the first step in the first slot as a hint
    const newPlaced = [...placed];
    newPlaced[0] = story.steps[0];
    setPlaced(newPlaced);
    if (selectedCard?.id === story.steps[0].id) setSelectedCard(null);
  };

  const handleNext = () => {
    const nextRound = round + 1;
    if (nextRound >= totalRounds) {
      onDone({ correct, incorrect, responseTimeMs: Date.now() - startTime, hintsUsed, gameId: "story_sequence" });
    } else {
      setRound(nextRound);
      loadNextStory();
    }
  };

  if (!story) return <div className="page-wrapper"><p>{t("loading")}</p></div>;

  const unplacedCards = shuffled.filter((s) => !placed.some((p) => p?.id === s.id));

  return (
    <div className="page-wrapper game-story-sequence" data-testid="story-sequence-game" style={{ background: "#FEFCE8" }}>
      <SpokenPrompt textKey="story_sequence_prompt" />

      <div className="round-indicator">Round {round + 1} of {totalRounds} — {story.title}</div>

      {/* Placement slots */}
      <div className="sequence-slots" aria-label="Place cards here">
        {placed.map((p, i) => (
          <div
            key={i}
            className={`sequence-slot ${p ? "filled" : "empty"} ${submitted && p ? (p.id === story.steps[i].id ? "slot-correct" : "slot-wrong") : ""}`}
            onClick={() => p ? handleRemoveFromSlot(i) : (selectedCard ? handlePlaceSlot(i) : undefined)}
            role="button"
            aria-label={p ? `Position ${i + 1}: ${p.label}` : `Position ${i + 1}: empty — tap to place`}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && (p ? handleRemoveFromSlot(i) : (selectedCard ? handlePlaceSlot(i) : undefined))}
          >
            <span className="slot-number" aria-hidden="true">{i + 1}</span>
            {p && (
              <div className="slot-card-content">
                <span className="slot-emoji" aria-hidden="true">{p.emoji}</span>
                <span className="slot-label">{p.label}</span>
              </div>
            )}
            {submitted && p && (
              <span className="slot-indicator" aria-hidden="true">
                {p.id === story.steps[i].id ? "✓" : "✗"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Explanation after submit */}
      {submitted && (
        <div className={`story-feedback ${isCorrect ? "correct" : "wrong"}`} aria-live="assertive">
          <p className="feedback-text">
            {isCorrect ? t("story_sequence_correct") : t("story_sequence_wrong")}
          </p>
          <p className="feedback-explanation">{story.explanation}</p>
          <button className="btn-primary" onClick={handleNext} style={{ marginTop: "1rem" }}>
            {round + 1 >= totalRounds ? t("back_home") : "Next Story →"}
          </button>
        </div>
      )}

      {/* Card hand */}
      {!submitted && (
        <>
          <p className="hand-label" aria-label="Available cards — tap to select">{t("story_sequence_place")}</p>
          <div className="card-hand" role="list">
            {unplacedCards.map((card) => (
              <button
                key={card.id}
                className={`story-card ${selectedCard?.id === card.id ? "selected" : ""}`}
                onClick={() => handleCardSelect(card)}
                aria-label={card.label}
                data-testid={`story-card-${card.id}`}
                role="listitem"
              >
                <span className="story-emoji" aria-hidden="true">{card.emoji}</span>
                <span className="story-label">{card.label}</span>
              </button>
            ))}
          </div>

          <div className="sequence-actions">
            {!hintsUsed && (
              <button className="btn-hint" onClick={handleHint} data-testid="hint-btn">
                {t("hint")}
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={placed.some((p) => p === null)}
              data-testid="btn-submit"
              style={{ flex: 1, maxWidth: "200px" }}
            >
              Check Order ✓
            </button>
          </div>
        </>
      )}
    </div>
  );
}
