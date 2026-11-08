/**
 * Progress Dashboard
 *
 * Shows:
 * - Sessions played per game
 * - Accuracy trends
 * - Day streak
 * - Best level reached
 *
 * Note: This is informational only — not clinical, not diagnostic.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { db, getOrCreateDefaultPatient, type GameSession } from "../db/db";

interface GameStat {
    gameType: string;
    sessions: number;
    accuracy: number;
    bestDifficulty: string;
}

const GAME_NAMES: Record<string, string> = {
    memory_match: "Memory Match",
    familiar_objects: "Familiar Objects",
    story_sequence: "Story Sequence",
    pattern_recall: "Pattern Recall",
    personal_album: "My Album",
    metamind: "MetaMind",
    fingerflow: "FingerFlow",
    focuslab: "FocusLab",
    memorysprint: "MemorySprint",
    neurogrid: "NeuroGrid",
    memory_matching: "Memory Matching",
};

const GAME_EMOJIS: Record<string, string> = {
    memory_match: "🃏",
    familiar_objects: "🍎",
    story_sequence: "📖",
    pattern_recall: "🔲",
    personal_album: "📸",
    metamind: "🤔",
    fingerflow: "🖐️",
    focuslab: "🎯",
    memorysprint: "⚡",
    neurogrid: "🔲",
    memory_matching: "🃏",
};

interface ProgressProps {
    onBack: () => void;
}

export default function Progress({ onBack }: ProgressProps) {
    const { t } = useTranslation();
    const [stats, setStats] = useState<GameStat[]>([]);
    const [streak, setStreak] = useState(0);
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const patient = await getOrCreateDefaultPatient();
            const sessions = await db.game_sessions
                .where("patientId")
                .equals(patient.id)
                .filter((s) => s.completed === 1)
                .toArray();

            setTotalSessions(sessions.length);

            // Streak
            const days = new Set(sessions.map((s) => s.startedAt.slice(0, 10)));
            const sortedDays = [...days].sort((a, b) => b.localeCompare(a));
            let s = 0;
            let today = new Date();
            for (const day of sortedDays) {
                const expected = today.toISOString().slice(0, 10);
                if (day === expected) {
                    s++;
                    today = new Date(today.getTime() - 86400000);
                } else {
                    break;
                }
            }
            setStreak(s);

            // Per-game stats
            const gameGroups: Record<string, GameSession[]> = {};
            for (const sess of sessions) {
                if (!gameGroups[sess.gameType]) gameGroups[sess.gameType] = [];
                gameGroups[sess.gameType].push(sess);
            }

            const gameStats: GameStat[] = Object.entries(gameGroups).map(([gameType, gameSessions]) => {
                // Calculate accuracy from scoreJson
                let totalCorrect = 0;
                let totalAttempts = 0;
                for (const sess of gameSessions) {
                    try {
                        const score = JSON.parse(sess.scoreJson);
                        if (typeof score.correct === "number") totalCorrect += score.correct;
                        if (typeof score.incorrect === "number") totalAttempts += score.correct + score.incorrect;
                    } catch {
                        // Ignore malformed score JSON
                    }
                }
                const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
                const difficulties = gameSessions.map((s) => s.difficulty ?? "easy");
                const bestDiff = difficulties.includes("hard") ? "hard"
                    : difficulties.includes("medium") ? "medium" : "easy";

                return { gameType, sessions: gameSessions.length, accuracy, bestDifficulty: bestDiff };
            });

            setStats(gameStats.sort((a, b) => b.sessions - a.sessions));
            setLoading(false);
        })();
    }, []);

    const difficultyLabel = { easy: "🟢 Easy", medium: "🟡 Medium", hard: "🔴 Hard" };

    return (
        <div
            className="page-wrapper progress-page"
            data-testid="progress-page"
            style={{ background: "#F8FAFC" }}
        >
            <header className="app-bar">
                <button className="btn-secondary btn-back" onClick={onBack} aria-label={t("back")}>←</button>
                <h1 className="page-title">📊 {t("progress_title")}</h1>
                <div style={{ width: "56px" }} />
            </header>

            {loading ? (
                <p style={{ textAlign: "center", marginTop: "3rem", color: "var(--color-text-muted)" }}>{t("loading")}</p>
            ) : (
                <>
                    {/* Summary cards */}
                    <div
                        className="progress-summary"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div className="summary-stat-card" style={{ background: "#DDF5EE" }}>
                            <span className="summary-stat-value">{totalSessions}</span>
                            <span className="summary-stat-label">{t("progress_sessions")}</span>
                        </div>
                        <div className="summary-stat-card" style={{ background: "#E9E5FF" }}>
                            <span className="summary-stat-value">🔥 {streak}</span>
                            <span className="summary-stat-label">{t("progress_streak")}</span>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div
                        className="disclaimer-box"
                        role="note"
                        style={{
                            background: "#FFF3C4",
                            border: "1px solid #f59e0b",
                            borderRadius: "0.75rem",
                            padding: "0.75rem 1rem",
                            fontSize: "0.875rem",
                            color: "#92400e",
                            marginBottom: "1.5rem",
                        }}
                    >
                        ⚠️ These are game practice results only — not a medical or cognitive assessment.
                    </div>

                    {/* Per-game stats */}
                    {stats.length === 0 ? (
                        <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: "2rem" }}>
                            {t("no_progress")}
                        </p>
                    ) : (
                        <div className="game-stats-list" role="list">
                            {stats.map((stat) => (
                                <div
                                    key={stat.gameType}
                                    className="game-stat-card"
                                    role="listitem"
                                    data-testid={`stat-${stat.gameType}`}
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "1rem",
                                        padding: "1rem",
                                        marginBottom: "0.75rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1rem",
                                    }}
                                >
                                    <span style={{ fontSize: "2.5rem" }} aria-hidden="true">
                                        {GAME_EMOJIS[stat.gameType] ?? "🎮"}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <strong className="game-stat-name">
                                            {GAME_NAMES[stat.gameType] ?? stat.gameType}
                                        </strong>
                                        <div className="game-stat-details" style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                                            <span>{stat.sessions} sessions</span>
                                            {stat.accuracy > 0 && <span> · {stat.accuracy}% accuracy</span>}
                                            <span> · {difficultyLabel[stat.bestDifficulty as keyof typeof difficultyLabel]}</span>
                                        </div>
                                        {/* Accuracy bar */}
                                        {stat.accuracy > 0 && (
                                            <div
                                                style={{
                                                    marginTop: "0.4rem",
                                                    background: "#e5e7eb",
                                                    borderRadius: "4px",
                                                    height: "6px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${stat.accuracy}%`,
                                                        background: "var(--color-brand-secondary)",
                                                        height: "100%",
                                                        borderRadius: "4px",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
