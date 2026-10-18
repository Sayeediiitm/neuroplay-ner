/**
 * LanguageSwitcher component
 *
 * Renders one pill button per supported language.
 * Tapping a language:
 *   1. Changes i18next language (persisted to localStorage)
 *   2. Updates the patient record in IndexedDB
 *   3. Logs a language_changed event
 *
 * Active language button gets a filled style.
 * All buttons meet the 56px touch-target minimum.
 */
import { type HTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LangCode } from "../i18n";
import { db, logEvent } from "../db/db";

interface LanguageSwitcherProps extends HTMLAttributes<HTMLDivElement> {
  patientId: string;
  className?: string;
}

export function LanguageSwitcher({ patientId, className = "", ...rest }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as LangCode;

  async function switchLang(code: LangCode) {
    if (code === currentLang) return;
    await i18n.changeLanguage(code);
    // Update patient record
    await db.patients.update(patientId, { language: code });
    // Append to event log
    await logEvent("language_changed", patientId, { from: currentLang, to: code });
  }

  return (
    <div className={`lang-switcher ${className}`} role="group" {...rest}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`lang-btn ${currentLang === lang.code ? "active" : ""}`}
          onClick={() => switchLang(lang.code as LangCode)}
          aria-pressed={currentLang === lang.code}
          data-testid={`lang-btn-${lang.code}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
