// Shared game interface used by all Mini‑games
// Each game component receives a `difficulty` prop (string) and a callback `onDone`
// that is called when the session ends.

export interface GameProps {
  /** Difficulty level (e.g., "easy", "medium", "hard") */
  difficulty: string;
  /** Called when the game finishes. Passes session metrics. */
  onDone: (metrics: GameMetrics) => void;
}

/** Metrics collected for a game session */
export interface GameMetrics {
  /** Number of correct actions */
  correct: number;
  /** Number of incorrect actions */
  incorrect: number;
  /** Total response time in milliseconds */
  responseTimeMs: number;
  /** Whether the user used any hints */
  hintsUsed: boolean;
  /** Game identifier (e.g., "memory_matching") */
  gameId: string;
}
