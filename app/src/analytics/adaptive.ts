// app/src/analytics/adaptive.ts

/**
 * Adaptive difficulty utilities for NeuroPlay NER.
 * Pure TypeScript helpers – no side effects other than optional logging.
 */
import { logEvent, AppEventType } from "../db/db";

/** Difficulty levels – integer 1 (easiest) to 5 (hardest) */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Result of skill estimation */
export interface SkillEstimate {
  difficulty: DifficultyLevel;
  /** 0‑1 accuracy estimate */
  accuracy: number;
  /** Average response time in ms */
  avgResponseTimeMs: number;
  /** Hints usage proportion (0‑1) */
  hintsUsedRatio: number;
}

/** Estimate skill based on recent game metrics */
export function estimateSkill(
  metrics: {
    correct: number;
    incorrect: number;
    responseTimeMs: number;
    hintsUsed: boolean;
  }[]
): SkillEstimate {
  const totalAttempts = metrics.reduce((s, m) => s + m.correct + m.incorrect, 0) || 1;
  const totalCorrect = metrics.reduce((s, m) => s + m.correct, 0);
  const accuracy = totalCorrect / totalAttempts;
  const avgResponseTimeMs =
    metrics.reduce((s, m) => s + m.responseTimeMs, 0) / (metrics.length || 1);
  const hintsUsedRatio =
    metrics.filter((m) => m.hintsUsed).length / (metrics.length || 1);

  // Simple mapping: higher accuracy & faster response => higher difficulty
  let difficulty: DifficultyLevel = 1;
  if (accuracy > 0.8 && avgResponseTimeMs < 2000 && hintsUsedRatio < 0.2) difficulty = 5;
  else if (accuracy > 0.7 && avgResponseTimeMs < 3000 && hintsUsedRatio < 0.3) difficulty = 4;
  else if (accuracy > 0.6 && avgResponseTimeMs < 4000 && hintsUsedRatio < 0.4) difficulty = 3;
  else if (accuracy > 0.5 && avgResponseTimeMs < 5000 && hintsUsedRatio < 0.5) difficulty = 2;
  else difficulty = 1;

  return { difficulty, accuracy, avgResponseTimeMs, hintsUsedRatio };
}

/** Record a difficulty change event */
export async function recordDifficultyChange(
  patientId: string,
  gameId: string,
  previous: DifficultyLevel,
  current: DifficultyLevel,
  reasons: string[]
): Promise<string> {
  const payload = {
    gameId,
    previous,
    current,
    reasons,
  };
  // AppEventType now includes "difficulty_changed"
  const type = "difficulty_changed" as AppEventType;
  // logEvent returns the event id
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { logEvent } = await import("../db/db");
  return logEvent(type, patientId, payload);
}

/** Check progress and return optional flag message */
export function checkProgress(
  recentMetrics: SkillEstimate[],
  baselineMetrics: SkillEstimate[]
): string | null {
  // compute averages
  const avgRecent =
    recentMetrics.reduce((s, m) => s + m.accuracy, 0) / (recentMetrics.length || 1);
  const avgBaseline =
    baselineMetrics.reduce((s, m) => s + m.accuracy, 0) / (baselineMetrics.length || 1);

  // ignore single day spikes – we already average over periods
  const decline = avgBaseline - avgRecent;
  // flag if decline > 0.1 (10%) and sustained (both periods > 3 days)
  if (decline > 0.1 && recentMetrics.length >= 3) {
    return "Worth discussing with a professional.";
  }
  return null;
}
