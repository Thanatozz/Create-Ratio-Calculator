import { useSettingsStore } from "../stores/settingsStore";
import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";
import type { Language, TranslationDictionary, TranslationParams } from "./types";

const dictionaries: Record<Language, TranslationDictionary> = { en, es, pt };

function interpolate(value: string, params?: TranslationParams): string {
  if (!params) {
    return value;
  }

  return Object.entries(params).reduce(
    (text, [key, replacement]) =>
      text.replaceAll(`{${key}}`, String(replacement)),
    value
  );
}

export function translate(
  language: Language,
  key: string,
  params?: TranslationParams
): string {
  return interpolate(dictionaries[language]?.[key] ?? en[key] ?? key, params);
}

export function useTranslation() {
  const language = useSettingsStore((state) => state.language);

  return (key: string, params?: TranslationParams) =>
    translate(language, key, params);
}

export type { Language, ThemeMode } from "./types";
