/**
 * Placeholder screens for tiles not yet built.
 * Used so navigation works in Part 1 — replaced in later parts.
 */
import { useTranslation } from "react-i18next";
import { OfflineBanner } from "../components/OfflineBanner";
import { AudioPrompt } from "../components/AudioPrompt";
import { SUPPORTED_LANGUAGES } from "../i18n";

interface PlaceholderProps {
  titleKey: string;
  icon: string;
  onBack: () => void;
}

export function Placeholder({ titleKey, icon, onBack }: PlaceholderProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const speechLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.speechLang ?? "en-IN";

  return (
    <div className="page-wrapper" data-testid={`placeholder-${titleKey}`}>
      <OfflineBanner />
      <header style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0 1rem" }}>
        <button className="btn-secondary" onClick={onBack} aria-label={t("back")}
          style={{ minWidth: "56px", padding: "0 1rem" }}>
          ← {t("back")}
        </button>
      </header>

      <AudioPrompt textKey="audio_tap_to_hear" lang={speechLang} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ fontSize: "4rem" }}>{icon}</span>
        <h1 className="section-header" style={{ textAlign: "center" }}>
          {t(titleKey)}
        </h1>
        <p style={{ color: "var(--color-text-muted)", textAlign: "center", fontSize: "var(--font-size-base)" }}>
          Coming in the next part ✨
        </p>
      </div>
    </div>
  );
}
