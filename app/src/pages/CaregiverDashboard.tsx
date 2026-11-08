// src/pages/CaregiverDashboard.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, type GameSession } from '../db/db';

/**
 * Caregiver Dashboard – shows overview of user activity for caregivers.
 * Displays session counts, reminder acknowledgements, and recent game metrics.
 * Uses the shared design system and respects accessibility.
 */
export default function CaregiverDashboard() {
  const { t } = useTranslation();

  const [totalSessions, setTotalSessions] = useState(0);
  const [reminderAcks, setReminderAcks] = useState(0);
  const [recentGames, setRecentGames] = useState<Array<Pick<GameSession, 'gameType' | 'completed' | 'startedAt'>>>([]);

  useEffect(() => {
    // Load aggregate data from IndexedDB.
    async function loadData() {
      const sessions = await db.game_sessions.toArray();
      setTotalSessions(sessions.length);

      const reminders = await db.reminders
        .filter((r) => r.confirmedAt !== null && r.confirmedAt !== undefined)
        .count();
      setReminderAcks(reminders);

      const recent = sessions
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 5)
        .map((s) => ({ gameType: s.gameType, completed: s.completed, startedAt: s.startedAt }));
      setRecentGames(recent);
    }
    loadData();
  }, []);

  return (
    <div className="page-wrapper" data-testid="caregiver-dashboard">
      <header className="dashboard-header">
        <h1>{String(t('caregiver_dashboard') ?? 'Caregiver Dashboard')}</h1>
      </header>
      <section className="summary-cards" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 150px', background: 'var(--soft-mint)', padding: '1rem', borderRadius: '1rem' }}>
          <h2>{String(t('total_sessions') ?? 'Total Sessions')}</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalSessions}</p>
        </div>
        <div className="card" style={{ flex: '1 1 150px', background: 'var(--warm-coral)', padding: '1rem', borderRadius: '1rem' }}>
          <h2>{String(t('reminder_acknowledgements') ?? 'Reminders Acknowledged')}</h2>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{reminderAcks}</p>
        </div>
      </section>
      <section className="recent-games" style={{ marginTop: '2rem' }}>
        <h2>{String(t('recent_games') ?? 'Recent Game Sessions')}</h2>
        {recentGames.length === 0 ? (
          <p>{String(t('no_recent_games') ?? 'No recent games recorded.')}</p>
        ) : (
          <ul>
            {recentGames.map((g, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                <strong>{g.gameType}</strong> – {g.completed ? String(t('completed') ?? 'Completed') : String(t('incomplete') ?? 'Incomplete')} <em>{new Date(g.startedAt).toLocaleString()}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
