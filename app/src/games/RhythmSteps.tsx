// src/games/RhythmSteps.tsx
import { useState } from 'react';
import type { GameProps, GameMetrics } from './Game';
import { useTranslation } from 'react-i18next';

/**
 * RhythmSteps – simple beat‑matching game.
 * Shows a short sequence of numbered beats. The user must tap the
 * corresponding button in the same order. After the sequence is
 * completed a metric object is sent to the parent via onDone.
 */
export default function RhythmSteps({ difficulty = 'easy', onDone }: GameProps) {
  const { t } = useTranslation();

  const [sequence, setSequence] = useState<number[]>([]);
  const [userIndex, setUserIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [responseTimeMs, setResponseTimeMs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // generate a simple sequence based on difficulty
  const generateSequence = () => {
    const length = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 4 : 3;
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 4) + 1); // beats 1‑4
    }
    setSequence(seq);
    setUserIndex(0);
    setCorrect(0);
    setIncorrect(0);
    setResponseTimeMs(0);
    setStartTime(Date.now());
  };

  const handleTap = (beat: number) => {
    if (!startTime) return;
    const now = Date.now();
    setResponseTimeMs((prev) => prev + (now - (startTime ?? now)));
    setStartTime(now);

    if (beat === sequence[userIndex]) {
      setCorrect((c) => c + 1);
      if (userIndex + 1 === sequence.length) {
        // finished successfully
        const metrics: GameMetrics = {
          correct,
          incorrect,
          responseTimeMs,
          hintsUsed: false,
          gameId: 'rhythmsteps',
        };
        onDone(metrics);
      } else {
        setUserIndex((i) => i + 1);
      }
    } else {
      setIncorrect((i) => i + 1);
      // end game on first mistake
      const metrics: GameMetrics = {
        correct,
        incorrect: incorrect + 1,
        responseTimeMs,
        hintsUsed: false,
        gameId: 'rhythmsteps',
      };
      onDone(metrics);
    }
  };

  return (
    <div className="page-wrapper" data-testid="rhythmsteps-game">
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0 1rem' }}>
        <h2>{t('rhythmsteps_title') ?? 'Rhythm Steps'}</h2>
      </header>

      {sequence.length === 0 ? (
        <button className="btn-primary" onClick={generateSequence}>
          {t('start_game') ?? 'Start Game'}
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
          {[1, 2, 3, 4].map((beat) => (
            <button
              key={beat}
              className="grid-cell"
              onClick={() => handleTap(beat)}
              aria-label={t('beat_button') + ' ' + beat}
            >
              {beat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
