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
  | "mood_logged"
  | "reminder_viewed"
  | "reminder_snoozed"
  | "family_photo_viewed"
  | "audio_prompt_played"
  | "offline_detected"
  | "sync_pushed"
  | "difficulty_changed";

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
}

export interface GameSession {
  id: string;           // UUID v4
  patientId: string;
  gameType: string;     // 'picture_match' | 'name_face' | 'word_sound'
  startedAt: string;
  durationSec: number;
  scoreJson: string;    // JSON string of game-specific score object
  completed: 0 | 1;
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
}

export interface MemoryItem {
  id: string;
  patientId: string;
  type: "photo" | "name" | "place";
  label: string;
  blob: Blob | null;    // photo stored as Blob in IndexedDB
  createdAt: string;
  addedBy: "patient" | "caregiver";
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

  constructor() {
    super("NeuroPlayNER");

    this.version(1).stores({
      // Primary key first, then indexed fields
      events:        "id, type, patientId, timestamp, synced",
      patients:      "id, alias",
      game_sessions: "id, patientId, gameType, startedAt, synced",
      mood_logs:     "id, patientId, timestamp, synced",
      reminders:     "id, patientId, scheduledFor",
      memory_items:  "id, patientId, type, createdAt",
    });
  }
}

export const db = new NeuroPlayDB();

// ----------------------------------------------------------------
// Helper: append a new event to the log
// ----------------------------------------------------------------
export async function logEvent(
  type: AppEventType,
  patientId: string,
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
  };
  await db.patients.add(patient);
  return patient;
}
