/**
 * Dexie (IndexedDB) schema for NeuroPlay NER
 *
 * ARCHITECTURE: Append-only event log is the single source of truth.
 * Every user interaction produces an AppEvent. Higher-level tables
 * (game_sessions, mood_logs, reminders) are convenience tables written
 * alongside the event log — never instead of it.
 *
 * SYNC: `synced: 0` means not yet pushed to API. The service worker
 * background-sync task filters on `synced: 0`.
 */
import Dexie, { type EntityTable } from "dexie";
import { v4 as uuidv4 } from "./uuid";

// ----------------------------------------------------------------
// Event type registry — extend as new features are added
// ----------------------------------------------------------------
export type AppEventType =
  | "app_opened"
  | "consent_accepted"
  | "consent_declined"
  | "language_changed"
  | "home_viewed"
  | "tile_tapped"
  | "game_started"
  | "game_completed"
  | "game_abandoned"
  | "game_session"
  | "mood_logged"
  | "reminder_viewed"
  | "reminder_snoozed"
  | "family_photo_viewed"
  | "audio_prompt_played"
  | "offline_detected"
  | "sync_pushed"
  | "difficulty_changed"
  | "myday_viewed"
  | "album_viewed";

// ----------------------------------------------------------------
// Core tables
// ----------------------------------------------------------------
export interface AppEvent {
  id: string;           // UUID v4 — primary key
  type: AppEventType;
  timestamp: string;    // ISO 8601
  patientId: string;    // local patient alias (not PII uploaded without consent)
  payload: Record<string, unknown>;
  synced: 0 | 1;        // 0 = pending, 1 = synced to server
}

export interface Patient {
  id: string;           // UUID v4
  alias: string;        // display name only — caregiver-set
  language: string;     // 'en' | 'hi' | 'as'
  createdAt: string;
  consentGiven: 0 | 1;
  /** Which section they use: 'memory_support' | 'neurogym' | 'both' */
  userMode?: "memory_support" | "neurogym" | "both";
}

export interface GameSession {
  id: string;           // UUID v4
  patientId: string;
  /** Game identifier: 'memory_match' | 'familiar_objects' | 'story_sequence' | 'pattern_recall' |
   *  'my_day' | 'personal_album' | 'metamind' | 'fingerflow' | 'focuslab' | 'memorysprint' |
   *  'neurogrid' | 'memory_matching' */
  gameType: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  scoreJson: string;    // JSON string of game-specific score object
  completed: 0 | 1;
  difficulty: string;   // 'easy' | 'medium' | 'hard'
  synced: 0 | 1;
}

export interface MoodLog {
  id: string;
  patientId: string;
  mood: 1 | 2 | 3 | 4 | 5;  // 1=very sad, 5=very happy
  note: string;
  timestamp: string;
  synced: 0 | 1;
}

export interface Reminder {
  id: string;
  patientId: string;
  title: string;
  body: string;
  scheduledFor: string;  // ISO date-time local
  recurring: "none" | "daily" | "weekly";
  dismissedAt: string | null;
  /** Category: 'medication' | 'appointment' | 'activity' | 'meal' | 'other' */
  category?: string;
  confirmedBy?: "user" | "caregiver";
  confirmedAt?: string | null;
}

export interface MemoryItem {
  id: string;
  patientId: string;
  type: "photo" | "name" | "place" | "event";
  label: string;
  blob: Blob | null;    // photo stored as Blob in IndexedDB
  payload?: Record<string, unknown>; // extra data: relationship, note, category, etc.
  createdAt: string;
  addedBy: "patient" | "caregiver";
  /** Category: 'family' | 'home' | 'festival' | 'event' | 'other' */
  category?: string;
}

/** Daily routine item for My Day */
export interface RoutineItem {
  id: string;
  patientId: string;
  title: string;
  description: string;
  timeOfDay: string;    // HH:MM
  icon: string;         // emoji or icon key
  category: "meal" | "medication" | "exercise" | "appointment" | "social" | "other";
  completedAt: string | null;
  completedBy: "user" | "caregiver" | null;
  date: string;         // YYYY-MM-DD
}

// ----------------------------------------------------------------
// Database class
// ----------------------------------------------------------------
class NeuroPlayDB extends Dexie {
  events!: EntityTable<AppEvent, "id">;
  patients!: EntityTable<Patient, "id">;
  game_sessions!: EntityTable<GameSession, "id">;
  mood_logs!: EntityTable<MoodLog, "id">;
  reminders!: EntityTable<Reminder, "id">;
  memory_items!: EntityTable<MemoryItem, "id">;
  routine_items!: EntityTable<RoutineItem, "id">;

  constructor() {
    super("NeuroPlayNER");

    this.version(1).stores({
      events:        "id, type, patientId, timestamp, synced",
      patients:      "id, alias",
      game_sessions: "id, patientId, gameType, startedAt, synced",
      mood_logs:     "id, patientId, timestamp, synced",
      reminders:     "id, patientId, scheduledFor",
      memory_items:  "id, patientId, type, createdAt",
    });

    // Version 2: adds routine_items, endedAt/difficulty on game_sessions
    this.version(2).stores({
      events:        "id, type, patientId, timestamp, synced",
      patients:      "id, alias",
      game_sessions: "id, patientId, gameType, startedAt, synced",
      mood_logs:     "id, patientId, timestamp, synced",
      reminders:     "id, patientId, scheduledFor, category",
      memory_items:  "id, patientId, type, createdAt, category",
      routine_items: "id, patientId, date, category",
    });
  }
}

export const db = new NeuroPlayDB();

// ----------------------------------------------------------------
// Helper: append a new event to the log
// ----------------------------------------------------------------
export async function logEvent(
  type: AppEventType,
  patientId: string = "unknown",
  payload: Record<string, unknown> = {}
): Promise<string> {
  const id = uuidv4();
  await db.events.add({
    id,
    type,
    timestamp: new Date().toISOString(),
    patientId,
    payload,
    synced: 0,
  });
  return id;
}

// ----------------------------------------------------------------
// Helper: save a completed game session
// ----------------------------------------------------------------
export async function saveGameSession(
  patientId: string,
  gameType: string,
  startedAt: string,
  score: Record<string, unknown>,
  completed: boolean,
  difficulty = "easy"
): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const durationSec = Math.round(
    (new Date(now).getTime() - new Date(startedAt).getTime()) / 1000
  );
  await db.game_sessions.add({
    id,
    patientId,
    gameType,
    startedAt,
    endedAt: now,
    durationSec,
    scoreJson: JSON.stringify(score),
    completed: completed ? 1 : 0,
    difficulty,
    synced: 0,
  });
  await logEvent(completed ? "game_completed" : "game_abandoned", patientId, {
    gameType,
    sessionId: id,
    ...score,
  });
  return id;
}

// ----------------------------------------------------------------
// Helper: get or create the default patient record
// (single-patient mode for MVP — multi-patient in later parts)
// ----------------------------------------------------------------
export async function getOrCreateDefaultPatient(): Promise<Patient> {
  const existing = await db.patients.toArray();
  if (existing.length > 0) return existing[0];

  const patient: Patient = {
    id: uuidv4(),
    alias: "Friend",
    language: "en",
    createdAt: new Date().toISOString(),
    consentGiven: 0,
    userMode: "both",
  };
  await db.patients.add(patient);
  return patient;
}

// ----------------------------------------------------------------
// Helper: get recent game sessions for adaptive difficulty
// ----------------------------------------------------------------
export async function getRecentSessions(
  patientId: string,
  gameType: string,
  limit = 10
): Promise<GameSession[]> {
  const all = await db.game_sessions
    .where("patientId")
    .equals(patientId)
    .filter((s) => s.gameType === gameType && s.completed === 1)
    .toArray();
  return all.slice(-limit);
}
