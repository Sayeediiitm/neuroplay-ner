// packages/game-sdk/src/index.ts

/**
 * Game SDK for NeuroPlay NER
 * Provides type definitions and helper functions for games.
 */

import { logEvent, AppEventType, getOrCreateDefaultPatient } from '../../app/src/db/db';

/** Manifest for a game */
export interface GameManifest {
  /** Unique identifier for the game, e.g., "picture_match" */
  id: string;
  /** Human readable name */
  name: string;
  /** Cognitive domains this game addresses */
  cognitiveDomains: Array<'memory' | 'attention' | 'sequencing' | 'language' | 'motor-timing'>;
  /** Supported difficulty range, inclusive (e.g., [1,5]) */
  difficultyRange: [number, number];
  /** Accessibility notes for the game */
  accessibilityNotes?: string;
  /** Asset file names required by the game */
  assets?: string[];
}

/** Interface that each game implementation must satisfy */
export interface GameInstance {
  /** Initialise the game with a difficulty level */
  init(difficulty: number): void;
  /** Called when the user provides input – the shape is game‑specific */
  onInput(event: unknown): void;
  /** Return metrics for the completed session */
  getSessionMetrics(): GameMetrics;
}

/** Metrics collected for a game session – mirrors the global AppEvent metric shape */
export interface GameMetrics {
  correct: number;
  incorrect: number;
  responseTimeMs: number;
  hintsUsed: boolean;
  /** Identifier of the game that produced these metrics */
  gameId: string;
}

/** Helper to log a game‑related event via the central Dexie logger */
export async function logGameEvent(
  type: Extract<AppEventType, 'game_started' | 'game_completed' | 'game_abandoned'>,
  payload: Record<string, unknown>
): Promise<string> {
  const patient = await getOrCreateDefaultPatient();
  return logEvent(type, patient.id, payload);
}

/** Export a simple type for difficulty */
export type Difficulty = number;
