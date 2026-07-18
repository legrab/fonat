import hu from "./hu.json";
import en from "./en.json";

export const supportedLocales = ["hu", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export type TranslationKey = keyof typeof hu;
export type TranslationParams = Record<string, string | number>;

const catalogs: Record<Locale, Record<TranslationKey, string>> = { hu, en };

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const template = catalogs[locale][key] ?? catalogs.hu[key] ?? key;
  return Object.entries(params).reduce(
    (value, [name, replacement]) =>
      value.replaceAll(`{${name}}`, String(replacement)),
    template,
  );
}
