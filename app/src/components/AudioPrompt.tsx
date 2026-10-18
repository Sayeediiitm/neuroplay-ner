/**
 * AudioPrompt component
 *
 * Uses the Web Speech API (SpeechSynthesis) — fully offline, no external TTS.
 * - Shows the screen's guidance text
 * - Tapping it reads it aloud in the current language
 * - Shows [LIMITED SUPPORT] badge if the device likely lacks the language voice
 *
 * Props:
 *   textKey   — i18n key for the spoken text
 *   lang      — speech language code, e.g. "hi-IN", "as-IN"
 *   limited   — if true, renders the LIMITED SUPPORT badge
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface AudioPromptProps {
  textKey: string;
  lang: string;
  limited?: boolean;
  className?: string;
}

export function AudioPrompt({
  textKey,
  lang,
  limited = false,
  className = "",
}: AudioPromptProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (utterRef.current) {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const text = t(textKey);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.85; // slightly slower for elderly users
    utter.pitch = 1.0;
    utter.volume = 1.0;

    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [t, textKey, lang]);

  return (
    <button
      className={`audio-bar ${className}`}
      onClick={speak}
      aria-label={playing ? t("audio_playing") : t("audio_tap_to_hear")}
      aria-live="polite"
      data-testid="audio-prompt"
    >
      <span className="audio-icon" aria-hidden="true">
        {playing ? "🔊" : "🔈"}
      </span>
      <span className="audio-text">
        {playing ? t("audio_playing") : t("audio_tap_to_hear")}
      </span>
      {limited && (
        <span className="audio-badge" title="Assamese TTS may not be available on all devices">
          {t("audio_limited")}
        </span>
      )}
    </button>
  );
}
