/**
 * Personal Album — Game 4 (Personal Memory Album)
 *
 * Displays family photos, stories, and familiar persons for the user to browse.
 * Caregivers can add photos; users browse and optionally answer prompts.
 * This is the "game" wrapper that uses the same memory_items DB.
 *
 * Visual: scrapbook-style, warm cream background, rounded photos, coral accents.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { GameProps } from "./Game";
import { db, logEvent, getOrCreateDefaultPatient, type Patient } from "../db/db";
import { v4 as uuidv4 } from "../db/uuid";

interface AlbumEntry {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  note: string;
  photo: string | null;
  category: string;
  createdAt: string;
}

const CATEGORIES = ["family", "home", "festival", "event", "other"];

export default function PersonalAlbum({ onDone }: GameProps) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [entries, setEntries] = useState<AlbumEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [viewEntry, setViewEntry] = useState<AlbumEntry | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("family");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const startTime = useState(Date.now())[0];

  useEffect(() => {
    getOrCreateDefaultPatient().then((p) => {
      setPatient(p);
      loadEntries(p.id);
      logEvent("album_viewed", p.id);
    });
  }, []);

  const loadEntries = async (patientId: string) => {
    const items = await db.memory_items
      .where("patientId")
      .equals(patientId)
      .filter((i) => i.type === "name" || i.type === "photo")
      .toArray();
    const mapped: AlbumEntry[] = items.map((i) => {
      const payload = i.payload as Record<string, string> | undefined;
      return {
        id: i.id,
        patientId: i.patientId,
        name: i.label,
        relationship: payload?.relationship ?? "",
        note: payload?.note ?? "",
        photo: payload?.photo ?? null,
        category: i.category ?? "family",
        createdAt: i.createdAt,
      };
    });
    setEntries(mapped.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    let photoData: string | null = null;
    if (photoFile) {
      photoData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(photoFile);
      });
    }
    const newItem = {
      id: uuidv4(),
      patientId: patient.id,
      type: "name" as const,
      label: name,
      blob: null,
      payload: { relationship, note, photo: photoData },
      category,
      createdAt: new Date().toISOString(),
      addedBy: "caregiver" as const,
    };
    await db.memory_items.add(newItem);
    await logEvent("family_photo_viewed", patient.id, { memberId: newItem.id });
    setName(""); setRelationship(""); setNote(""); setCategory("family"); setPhotoFile(null);
    setSaving(false);
    setShowForm(false);
    await loadEntries(patient.id);
  };

  const handleDelete = async (id: string) => {
    await db.memory_items.delete(id);
    if (patient) await loadEntries(patient.id);
    setViewEntry(null);
  };

  const filtered = activeCategory === "all"
    ? entries
    : entries.filter((e) => e.category === activeCategory);

  // Detail view
  if (viewEntry) {
    return (
      <div className="page-wrapper album-detail" data-testid="album-detail" style={{ background: "#FEFCE8" }}>
        <header className="app-bar">
          <button className="btn-secondary btn-back" onClick={() => setViewEntry(null)}>←</button>
          <h1 className="page-title">📸 {viewEntry.name}</h1>
          <button
            className="btn-icon-danger"
            onClick={() => handleDelete(viewEntry.id)}
            aria-label="Delete"
            style={{ color: "#dc2626", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
          >
            🗑️
          </button>
        </header>

        {viewEntry.photo && (
          <div className="album-photo-large">
            <img
              src={viewEntry.photo}
              alt={viewEntry.name}
              style={{ width: "100%", maxHeight: "280px", objectFit: "cover", borderRadius: "1.25rem" }}
            />
          </div>
        )}
        <div className="album-detail-info">
          {viewEntry.relationship && (
            <p className="album-relationship">
              <strong>Relationship:</strong> {viewEntry.relationship}
            </p>
          )}
          {viewEntry.note && <p className="album-note">{viewEntry.note}</p>}
          <p className="album-category-tag">{viewEntry.category}</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            if ("speechSynthesis" in window && viewEntry.note) {
              const u = new SpeechSynthesisUtterance(`This is ${viewEntry.name}. ${viewEntry.note}`);
              u.lang = "en-IN";
              u.rate = 0.85;
              window.speechSynthesis.speak(u);
            }
          }}
          style={{ marginTop: "1.5rem" }}
        >
          🔈 Hear about {viewEntry.name}
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrapper personal-album" data-testid="personal-album-game" style={{ background: "#FEFCE8" }}>
      <header className="app-bar">
        <button
          className="btn-secondary btn-back"
          onClick={() =>
            onDone({
              correct: entries.length,
              incorrect: 0,
              responseTimeMs: Date.now() - startTime,
              hintsUsed: false,
              gameId: "personal_album",
            })
          }
        >
          ←
        </button>
        <h1 className="page-title">📸 {t("album_title")}</h1>
        <button
          className="btn-add-album"
          onClick={() => setShowForm(true)}
          aria-label={t("album_add")}
          style={{
            background: "var(--color-brand-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "0.5rem 1rem",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </header>

      {/* Category filter */}
      <div className="category-pills" role="tablist">
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            role="tab"
            aria-selected={activeCategory === cat}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Album grid */}
      {filtered.length === 0 ? (
        <p className="album-empty" style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: "2rem" }}>
          {t("album_no_items")}
        </p>
      ) : (
        <div
          className="album-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {filtered.map((entry) => (
            <button
              key={entry.id}
              className="album-card"
              onClick={() => setViewEntry(entry)}
              aria-label={`${entry.name} — ${entry.relationship}`}
              data-testid={`album-entry-${entry.id}`}
            >
              {entry.photo ? (
                <img
                  src={entry.photo}
                  alt={entry.name}
                  style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "1rem 1rem 0 0" }}
                />
              ) : (
                <div className="album-card-placeholder" aria-hidden="true">
                  👤
                </div>
              )}
              <div className="album-card-footer">
                <strong className="album-card-name">{entry.name}</strong>
                {entry.relationship && (
                  <span className="album-card-rel">{entry.relationship}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="modal-overlay" role="dialog" aria-label={t("album_add")}>
          <div className="modal-card">
            <h2 className="modal-title">{t("album_add")}</h2>
            <form onSubmit={handleAdd}>
              <label className="form-label">{t("album_name")}*<br />
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="form-label">{t("album_relationship")}<br />
                <input
                  type="text"
                  className="form-input"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                />
              </label>
              <label className="form-label">{t("album_note")}<br />
                <textarea
                  className="form-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </label>
              <label className="form-label">{t("album_category")}<br />
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">{t("album_photo")}<br />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Saving..." : t("album_saved")}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
