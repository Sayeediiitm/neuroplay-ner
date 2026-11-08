/**
 * SpokenPrompt — inline spoken-instruction bar for game screens.
 * Simpler than AudioPrompt; takes a text key and speaks it inline.
 * Uses the Web Speech API — fully offline.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface SpokenPromptProps {
  textKey: string;
  lang?: string;
  autoPlay?: boolean;
}

export function SpokenPrompt({ textKey, lang = "en-IN", autoPlay = false }: SpokenPromptProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = t(textKey);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [t, textKey, lang]);

  useEffect(() => {
    if (autoPlay) speak();
  }, [autoPlay, speak]);

  return (
    <button
      className="audio-bar"
      onClick={speak}
      aria-label={playing ? t("audio_playing") : t("audio_tap_to_hear")}
      data-testid="spoken-prompt"
      style={{ marginBottom: "1rem" }}
    >
      <span className="audio-icon" aria-hidden="true">{playing ? "🔊" : "🔈"}</span>
      <span className="audio-text">{playing ? t("audio_playing") : t("audio_tap_to_hear")}</span>
    </button>
  );
}
