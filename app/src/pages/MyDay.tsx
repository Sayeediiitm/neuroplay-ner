/**
 * My Day — Daily Routine and Schedule
 *
 * Shows:
 * - Large clock showing current time
 * - Today's date
 * - Daily activity cards (breakfast, medication, walk, etc.)
 * - Ability to mark activities done
 * - Caregivers can add scheduled reminders
 *
 * Visual: mint and cream, large clock, simple activity icons, clear buttons.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { db, logEvent, getOrCreateDefaultPatient, type Patient, type RoutineItem } from "../db/db";
import { v4 as uuidv4 } from "../db/uuid";

const CATEGORY_ICONS: Record<string, string> = {
  meal:        "🍽️",
  medication:  "💊",
  exercise:    "🚶",
  appointment: "🏥",
  social:      "👥",
  other:       "📌",
};

const CATEGORIES = ["meal", "medication", "exercise", "appointment", "social", "other"] as const;

const DEFAULT_ROUTINES = [
  { title: "Morning Tea", description: "Have your morning tea", timeOfDay: "07:30", icon: "☕", category: "meal" as const },
  { title: "Breakfast", description: "Eat a healthy breakfast", timeOfDay: "08:30", icon: "🍳", category: "meal" as const },
  { title: "Morning Walk", description: "Take a gentle walk outside", timeOfDay: "09:00", icon: "🚶", category: "exercise" as const },
  { title: "Lunch", description: "Have lunch", timeOfDay: "12:30", icon: "🍱", category: "meal" as const },
  { title: "Rest Time", description: "Take a short rest", timeOfDay: "14:00", icon: "😴", category: "other" as const },
  { title: "Evening Tea", description: "Evening tea time", timeOfDay: "16:30", icon: "☕", category: "meal" as const },
  { title: "Dinner", description: "Have your evening meal", timeOfDay: "19:00", icon: "🍛", category: "meal" as const },
];

function formatTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface MyDayProps {
  onBack: () => void;
}

export default function MyDay({ onBack }: MyDayProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());
  const [patient, setPatient] = useState<Patient | null>(null);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTime, setFormTime] = useState("08:00");
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>("meal");

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = now.toISOString().slice(0, 10);

  useEffect(() => {
    getOrCreateDefaultPatient().then(async (p) => {
      setPatient(p);
      await logEvent("myday_viewed", p.id);
      await loadRoutines(p.id);
    });
  }, []);

  const loadRoutines = async (patientId: string) => {
    const items = await db.routine_items
      .where("patientId")
      .equals(patientId)
      .filter((r) => r.date === today)
      .toArray();

    if (items.length === 0) {
      // Seed with defaults if none exist
      const defaults: RoutineItem[] = DEFAULT_ROUTINES.map((d) => ({
        id: uuidv4(),
        patientId,
        title: d.title,
        description: d.description,
        timeOfDay: d.timeOfDay,
        icon: d.icon,
        category: d.category,
        completedAt: null,
        completedBy: null,
        date: today,
      }));
      await db.routine_items.bulkAdd(defaults);
      setRoutines(defaults.sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay)));
    } else {
      setRoutines(items.sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay)));
    }
  };

  const markDone = async (id: string) => {
    if (!patient) return;
    await db.routine_items.update(id, {
      completedAt: new Date().toISOString(),
      completedBy: "user",
    });
    await loadRoutines(patient.id);
  };

  const handleAddRoutine = async (e: FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    const item: RoutineItem = {
      id: uuidv4(),
      patientId: patient.id,
      title: formTitle,
      description: formDesc,
      timeOfDay: formTime,
      icon: CATEGORY_ICONS[formCategory] ?? "📌",
      category: formCategory,
      completedAt: null,
      completedBy: null,
      date: today,
    };
    await db.routine_items.add(item);
    setFormTitle(""); setFormDesc(""); setFormTime("08:00"); setFormCategory("meal");
    setShowForm(false);
    await loadRoutines(patient.id);
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const completedCount = routines.filter((r) => r.completedAt).length;

  return (
    <div
      className="page-wrapper myday-page"
      data-testid="myday-page"
      style={{ background: "#F0FFF4", paddingBottom: "4rem" }}
    >
      <header className="app-bar">
        <button className="btn-secondary btn-back" onClick={onBack} aria-label={t("back")}>←</button>
        <h1 className="page-title">📅 {t("myday_title")}</h1>
        <button
          style={{
            background: "var(--color-brand-secondary)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "0.5rem 1rem",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
          onClick={() => setShowForm(true)}
          aria-label={t("myday_add")}
        >
          +
        </button>
      </header>

      {/* Large Clock */}
      <div className="myday-clock-section" aria-label={t("myday_clock_aria")}>
        <div className="big-clock" aria-live="polite">
          {formatTime(now)}
        </div>
        <div className="today-date">{formatDate(now)}</div>
        <button
          className="speak-time-btn"
          onClick={() => speak(`The time is ${formatTime(now)}. Today is ${formatDate(now)}.`)}
          aria-label="Hear the time"
        >
          🔈 Hear the time
        </button>
      </div>

      {/* Progress */}
      <div className="myday-progress-bar-wrapper">
        <div className="myday-progress-label">
          {completedCount} of {routines.length} done today
        </div>
        <div className="myday-progress-track">
          <div
            className="myday-progress-fill"
            style={{
              width: routines.length > 0 ? `${(completedCount / routines.length) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* Routine list */}
      <div className="routine-list" role="list">
        {routines.map((item) => (
          <div
            key={item.id}
            className={`routine-card ${item.completedAt ? "completed" : ""}`}
            role="listitem"
            data-testid={`routine-${item.id}`}
          >
            <div className="routine-time-col">
              <span className="routine-time">{item.timeOfDay}</span>
              <span className="routine-icon" aria-hidden="true">{item.icon}</span>
            </div>
            <div className="routine-info">
              <strong className="routine-title">{item.title}</strong>
              {item.description && <span className="routine-desc">{item.description}</span>}
              {item.completedAt && (
                <span className="routine-done-label">✓ Done</span>
              )}
            </div>
            <div className="routine-actions">
              {!item.completedAt && (
                <button
                  className="btn-done-routine"
                  onClick={() => markDone(item.id)}
                  aria-label={`Mark ${item.title} as done`}
                  data-testid={`done-btn-${item.id}`}
                >
                  ✓
                </button>
              )}
              <button
                className="btn-speak-routine"
                onClick={() => speak(`${item.title}. ${item.description}`)}
                aria-label={`Hear about ${item.title}`}
              >
                🔈
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="modal-overlay" role="dialog" aria-label={t("myday_add")}>
          <div className="modal-card">
            <h2 className="modal-title">{t("myday_add")}</h2>
            <form onSubmit={handleAddRoutine}>
              <label className="form-label">{t("myday_activity_title")}*<br />
                <input
                  type="text"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </label>
              <label className="form-label">Description<br />
                <input
                  type="text"
                  className="form-input"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </label>
              <label className="form-label">{t("myday_activity_time")}<br />
                <input
                  type="time"
                  className="form-input"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </label>
              <label className="form-label">{t("myday_activity_category")}<br />
                <select
                  className="form-input"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as typeof CATEGORIES[number])}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add ✓</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
