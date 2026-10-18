// Memory Matching Mini‑game
// Very lightweight implementation – 6 cards (3 pairs) using placeholder images.
// Uses the shared GameProps / GameMetrics interfaces.

import { useEffect, useState } from "react";
import { GameProps, GameMetrics } from "../games/Game";
import { logEvent } from "../db/db";
import { SpokenPrompt } from "../components/SpokenPrompt";
import { useTranslation } from "react-i18next";

// Simple static card data – in a real app this would be sourced from assets & licences.
const CARD_IMAGES = [
  "assets/memory/card1.png",
  "assets/memory/card2.png",
  "assets/memory/card3.png",
];

interface Card {
  id: number;
  image: string;
  matched: boolean;
  flipped: boolean;
}

export function MemoryMatching({ difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [first, setFirst] = useState<Card | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(false);
  const [startTime] = useState(Date.now());

  // Initialise shuffled cards (each image appears twice)
  useEffect(() => {
    const pairCards: Card[] = CARD_IMAGES.flatMap((img, i) => [
      { id: i * 2, image: img, matched: false, flipped: false },
      { id: i * 2 + 1, image: img, matched: false, flipped: false },
    ]);
    // Simple shuffle
    for (let i = pairCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairCards[i], pairCards[j]] = [pairCards[j], pairCards[i]];
    }
    setCards(pairCards);
  }, []);

  const flipCard = (card: Card) => {
    if (card.flipped || card.matched) return;
    const newCards = cards.map(c =>
      c.id === card.id ? { ...c, flipped: true } : c
    );
    setCards(newCards);
    if (!first) {
      setFirst({ ...card, flipped: true });
    } else {
      // second card selected
      if (first.image === card.image) {
        // match!
        setCards(prev =>
          prev.map(c =>
            c.image === card.image ? { ...c, matched: true } : c
          )
        );
        setCorrect(prev => prev + 1);
      } else {
        setIncorrect(prev => prev + 1);
        // flip back after brief pause
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === card.id || c.id === first.id
                ? { ...c, flipped: false }
                : c
            )
          );
        }, 800);
      }
      setFirst(null);
    }
  };

  // End condition – all cards matched
  useEffect(() => {
    if (cards.length && cards.every(c => c.matched)) {
      const metrics: GameMetrics = {
        correct,
        incorrect,
        responseTimeMs: Date.now() - startTime,
        hintsUsed,
        gameId: "memory_matching",
      };
      // Log session event for analytics
      logEvent("game_session", undefined, { ...metrics }).catch(() => {});
      onDone(metrics);
    }
  }, [cards, correct, incorrect, hintsUsed, onDone, startTime]);

  // Simple hint – reveal a random unmatched pair
  const useHint = () => {
    if (hintsUsed) return;
    const unmatched = cards.filter(c => !c.matched && !c.flipped);
    if (unmatched.length >= 2) {
      const pairImg = unmatched[0].image;
      const hints = unmatched.filter(c => c.image === pairImg);
      setCards(prev =>
        prev.map(c =>
          hints.some(h => h.id === c.id) ? { ...c, flipped: true } : c
        )
      );
      setHintsUsed(true);
    }
  };

  return (
    <div className="game memory-matching" data-testid="memory-matching-game">
      <SpokenPrompt textKey="game_memory_prompt" />
      <button onClick={useHint} disabled={hintsUsed} data-testid="hint-btn">
        {t("hint")}
      </button>
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flipCard(card)}
            disabled={card.matched}
            aria-label={card.flipped || card.matched ? "card face" : "card back"}
            data-testid={`card-${card.id}`}
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#eee",
              backgroundImage: card.flipped || card.matched ? `url(${card.image})` : undefined,
              backgroundSize: "cover",
            }}
          />
        ))}
      </div>
    </div>
  );
}
