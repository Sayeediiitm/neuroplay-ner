/**
 * GameLibrary — shows available games for a section.
 * Sections: 'memory_support' | 'neurogym'
 */
import { useTranslation } from "react-i18next";
import { OfflineBanner } from "../components/OfflineBanner";

interface GameInfo {
  id: string;
  emoji: string;
  nameKey: string;
  descKey: string;
  color: string;
  accent: string;
  available: boolean;
}

const MEMORY_GAMES: GameInfo[] = [
  {
    id: "memory_match",
    emoji: "🃏",
    nameKey: "game_memory_match",
    descKey: "game_memory_match_desc",
    color: "#DDF5EE",
    accent: "#0e9f6e",
    available: true,
  },
  {
    id: "familiar_objects",
    emoji: "🍎",
    nameKey: "game_familiar_objects",
    descKey: "game_familiar_objects_desc",
    color: "#FFF3C4",
    accent: "#d97706",
    available: true,
  },
  {
    id: "story_sequence",
    emoji: "📖",
    nameKey: "game_story_sequence",
    descKey: "game_story_sequence_desc",
    color: "#DCEAFE",
    accent: "#2563eb",
    available: true,
  },
  {
    id: "pattern_recall",
    emoji: "🔲",
    nameKey: "game_pattern_recall",
    descKey: "game_pattern_recall_desc",
    color: "#E9E5FF",
    accent: "#7c3aed",
    available: true,
  },
  {
    id: "personal_album",
    emoji: "📸",
    nameKey: "game_personal_album",
    descKey: "game_personal_album_desc",
    color: "#FFE5D5",
    accent: "#ea580c",
    available: true,
  },
];

const NEUROGYM_GAMES: GameInfo[] = [
  {
    id: "metamind",
    emoji: "🤔",
    nameKey: "game_metamind",
    descKey: "game_metamind_desc",
    color: "#E9E5FF",
    accent: "#172554",
    available: true,
  },
  {
    id: "fingerflow",
    emoji: "🖐️",
    nameKey: "game_fingerflow",
    descKey: "game_fingerflow_desc",
    color: "#DDF5EE",
    accent: "#ea580c",
    available: true,
  },
  {
    id: "focuslab",
    emoji: "🎯",
    nameKey: "game_focuslab",
    descKey: "game_focuslab_desc",
    color: "#DCEAFE",
    accent: "#172554",
    available: true,
  },
  {
    id: "memorysprint",
    emoji: "⚡",
    nameKey: "game_memorysprint",
    descKey: "game_memorysprint_desc",
    color: "#E9E5FF",
    accent: "#7c3aed",
    available: true,
  },
];

interface GameLibraryProps {
  section: "memory_support" | "neurogym";
  onSelectGame: (gameId: string) => void;
  onBack: () => void;
}

export function GameLibrary({ section, onSelectGame, onBack }: GameLibraryProps) {
  const { t } = useTranslation();
  const games = section === "memory_support" ? MEMORY_GAMES : NEUROGYM_GAMES;
  const sectionKey = section === "memory_support" ? "section_memory_support" : "section_neurogym";
  const emoji = section === "memory_support" ? "🌿" : "💪";

  return (
    <div className="page-wrapper" data-testid="game-library">
      <OfflineBanner />

      <header className="app-bar">
        <button
          className="btn-secondary btn-back"
          onClick={onBack}
          aria-label={t("back")}
          data-testid="btn-back"
        >
          ←
        </button>
        <h1 className="page-title">
          <span aria-hidden="true">{emoji}</span> {t(sectionKey)}
        </h1>
        <div style={{ width: "56px" }} />
      </header>

      <div className="game-library-grid" role="list">
        {games.map((game) => (
          <button
            key={game.id}
            className="game-library-card"
            style={{
              "--card-bg": game.color,
              "--card-accent": game.accent,
            } as React.CSSProperties}
            onClick={() => game.available && onSelectGame(game.id)}
            aria-label={t(game.nameKey)}
            data-testid={`game-card-${game.id}`}
            role="listitem"
          >
            <span className="game-card-emoji" aria-hidden="true">{game.emoji}</span>
            <div className="game-card-info">
              <span className="game-card-name">{t(game.nameKey)}</span>
              <span className="game-card-desc">{t(game.descKey)}</span>
            </div>
            <span className="game-card-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
