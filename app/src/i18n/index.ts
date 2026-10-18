/**
 * i18n configuration for NeuroPlay NER
 * All locale JSONs are bundled at build time — no network fetch needed.
 * This means language switching works 100% offline.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import as_ from "./locales/as.json";

export const SUPPORTED_LANGUAGES: ReadonlyArray<{
  code: string;
  label: string;
  speechLang: string;
  audioLimited?: boolean;
}> = [
  { code: "en", label: "English", speechLang: "en-IN" },
  { code: "hi", label: "हिन्दी", speechLang: "hi-IN" },
  {
    code: "as",
    label: "অসমীয়া",
    speechLang: "as-IN", // May fall back to en-IN on many devices
    audioLimited: true,
  },
];

export type LangCode = "en" | "hi" | "as";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      as: { translation: as_ },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "as"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "neuroplay_lang",
    },
  });

export default i18n;
