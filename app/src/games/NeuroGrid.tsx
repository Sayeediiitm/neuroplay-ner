import { useState, useEffect, useRef } from 'react';
import { GameProps, GameMetrics } from './Game';
import { useTranslation } from 'react-i18next';

/**
 * NeuroGrid – a 5×5 sequence memory game.
 * Implements the interface defined in Game.ts.
 */
export default function NeuroGrid({ difficulty: _difficulty, onDone }: GameProps) {
  const { t } = useTranslation();
  void _difficulty;

  const GRID_SIZE = 5;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

  const [sequence, setSequence] = useState<number[]>([]); // indices 0‑24
  const [userIndex, setUserIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [responseTimeMs, setResponseTimeMs] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Helper – generate a random cell index
  const randomCell = () => Math.floor(Math.random() * TOTAL_CELLS);

  // Start a new game
  const startGame = () => {
    setSequence([randomCell()]);
    setLevel(1);
    setCorrect(0);
    setIncorrect(0);
    setResponseTimeMs(0);
    setHintsUsed(false);
    setGameOver(false);
    setUserIndex(0);
  };

  // Add another step to the sequence and display it
  const extendSequence = () => {
    setSequence((prev) => [...prev, randomCell()]);
    setLevel((l) => l + 1);
    setUserIndex(0);
  };

  // Display the current sequence to the player
  useEffect(() => {
    if (sequence.length === 0) return;
    setShowing(true);
    const delay = 800; // ms per flash
    const pause = 400;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    sequence.forEach((cell, i) => {
      const showId = setTimeout(() => {
        const el = document.getElementById(`cell-${cell}`);
        if (el) el.classList.add('active');
      }, i * (delay + pause));
      const hideId = setTimeout(() => {
        const el = document.getElementById(`cell-${cell}`);
        if (el) el.classList.remove('active');
        if (i === sequence.length - 1) setShowing(false);
      }, i * (delay + pause) + delay);
      timeoutIds.push(showId, hideId);
    });
    // Cleanup on unmount / sequence change
    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [sequence]);

  // Handle cell click / tap
  const handleCell = (idx: number) => {
    if (showing || gameOver) return;
    const now = Date.now();
    if (startTimeRef.current) {
      setResponseTimeMs((prev) => prev + (now - startTimeRef.current));
    }
    startTimeRef.current = now;
    const expected = sequence[userIndex];
    const el = document.getElementById(`cell-${idx}`);
    if (idx === expected) {
      // correct step
      if (el) el.classList.add('correct');
      setTimeout(() => el && el.classList.remove('correct'), 300);
      setCorrect((c) => c + 1);
      if (userIndex + 1 === sequence.length) {
        // round complete
        setTimeout(() => {
          // small pause then next round
          extendSequence();
        }, 500);
      } else {
        setUserIndex((u) => u + 1);
      }
    } else {
      // wrong step – game over
      if (el) el.classList.add('incorrect');
      setTimeout(() => el && el.classList.remove('incorrect'), 500);
      setIncorrect((i) => i + 1);
      setGameOver(true);
    }
  };

  // When game ends, report metrics
  useEffect(() => {
    if (gameOver) {
      const metrics: GameMetrics = {
        correct,
        incorrect,
        responseTimeMs,
        hintsUsed,
        gameId: 'neurogrid',
      };
      onDone(metrics);
    }
  }, [gameOver]);

  // Keyboard – map number keys to cells (0‑9) for simplicity; arrows not implemented.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showing || gameOver) return;
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 0 && num < TOTAL_CELLS) {
        handleCell(num);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showing, gameOver, userIndex, sequence]);

  // Render grid cells
  const renderGrid = () => {
    const cells = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      cells.push(
        <button
          key={i}
          id={`cell-${i}`}
          className="grid-cell"
          onClick={() => handleCell(i)}
          disabled={showing || gameOver}
          aria-label={t('grid_cell') + ' ' + i}
        />,
      );
    }
    return cells;
  };

  return (
    <div className="page-wrapper" data-testid="neurogrid-game">
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0 1rem' }}>
        <button className="btn-secondary" onClick={() => onDone({ correct, incorrect, responseTimeMs, hintsUsed, gameId: 'neurogrid' })} aria-label={t('back')} style={{ minWidth: '56px', padding: '0 1rem' }}>
          ← {t('back')}
        </button>
        <h2>{t('neurogrid_title') ?? 'NeuroGrid'}</h2>
      </header>

      <section style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <p>{t('level') ?? 'Level'}: {level}</p>
        <p>{t('score') ?? 'Score'}: {correct - incorrect}</p>
        {gameOver && <p>{t('game_over') ?? 'Game Over'}</p>}
      </section>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: '4px', maxWidth: '400px', margin: '0 auto' }}>
        {renderGrid()}
      </div>

      <section style={{ marginTop: '1rem', textAlign: 'center' }}>
        {sequence.length === 0 && (
          <button className="btn-primary" onClick={startGame}>
            {t('start_game') ?? 'Start Game'}
          </button>
        )}
        {gameOver && (
          <>
            <button className="btn-primary" onClick={startGame} style={{ marginRight: '0.5rem' }}>
              {t('retry') ?? 'Retry'}
            </button>
            <button className="btn-secondary" onClick={() => onDone({ correct, incorrect, responseTimeMs, hintsUsed, gameId: 'neurogrid' })}>
              {t('back_home') ?? 'Back to Home'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
