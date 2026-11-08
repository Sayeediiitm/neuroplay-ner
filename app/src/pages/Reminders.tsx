import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, logEvent, getOrCreateDefaultPatient, type Patient } from '../db/db';
import { v4 as uuidv4 } from '../db/uuid';

interface Reminder {
  id: string;
  patientId: string;
  title: string;
  body: string;
  scheduledFor: string; // ISO string
  recurring: 'none' | 'daily' | 'weekly';
  dismissedAt: string | null;
}

export default function Reminders({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [datetime, setDatetime] = useState('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly'>('none');

  // Load patient and reminders
  useEffect(() => {
    getOrCreateDefaultPatient().then((p) => {
      setPatient(p);
      loadReminders(p.id);
    });
  }, []);

  const loadReminders = async (patientId: string) => {
    const list = await db.reminders.where('patientId').equals(patientId).toArray();
    setReminders(list as Reminder[]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    const scheduledFor = datetime ? new Date(datetime).toISOString() : new Date().toISOString();
    const newReminder: Reminder = {
      id: uuidv4(),
      patientId: patient.id,
      title,
      body,
      scheduledFor,
      recurring,
      dismissedAt: null,
    };
    await db.reminders.add(newReminder);
    await logEvent('reminder_viewed', patient.id, { reminderId: newReminder.id });
    setTitle('');
    setBody('');
    setDatetime('');
    setRecurring('none');
    loadReminders(patient.id);
  };

  const markDone = async (id: string) => {
    if (!patient) return;
    await db.reminders.update(id, { dismissedAt: new Date().toISOString() });
    loadReminders(patient.id);
  };

  const markLater = async (id: string) => {
    if (patient) {
      await logEvent('reminder_snoozed', patient.id, { reminderId: id });
    }
  };

  return (
    <div className="page-wrapper" data-testid="reminders-page">
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0 1rem' }}>
        <button className="btn-secondary" onClick={onBack} aria-label={t('back')} style={{ minWidth: '56px', padding: '0 1rem' }}>
          ← {t('back')}
        </button>
        <h2>{t('tile_reminders')}</h2>
      </header>

      <section style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('reminder_title') ?? 'Title'}:</label><br />
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('reminder_note') ?? 'Note'}:</label><br />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('reminder_time') ?? 'When'}:</label><br />
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>{t('reminder_repeat') ?? 'Repeat'}:</label><br />
            <select value={recurring} onChange={(e) => setRecurring(e.target.value as "none" | "daily" | "weekly")} style={{ width: '100%' }}>
              <option value="none">{t('repeat_none') ?? 'None'}</option>
              <option value="daily">{t('repeat_daily') ?? 'Daily'}</option>
              <option value="weekly">{t('repeat_weekly') ?? 'Weekly'}</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">{t('add_reminder') ?? 'Add Reminder'}</button>
        </form>
      </section>

      <section>
        <h3>{t('upcoming_reminders') ?? 'Upcoming'}</h3>
        {reminders.filter(r => !r.dismissedAt).length === 0 && <p>{t('no_reminders') ?? 'No reminders'}</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reminders.filter(r => !r.dismissedAt).map((r) => (
            <li key={r.id} style={{ marginBottom: '0.75rem', border: '1px solid var(--color-divider)', padding: '0.5rem', borderRadius: '4px' }}>
              <strong>{r.title}</strong><br />
              <small>{new Date(r.scheduledFor).toLocaleString()}</small><br />
              <p>{r.body}</p>
              <button className="btn-success" onClick={() => markDone(r.id)} style={{ marginRight: '0.5rem' }}>{t('done') ?? 'Done'}</button>
              <button className="btn-secondary" onClick={() => markLater(r.id)}>{t('later') ?? 'Later'}</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
