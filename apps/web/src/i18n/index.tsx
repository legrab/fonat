import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isLocale,
  translate,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from "./core";

export {
  isLocale,
  supportedLocales,
  translate,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from "./core";

const storageKey = "fonat.locale";

function initialLocale(): Locale {
  if (typeof window === "undefined") return "hu";
  const stored = window.localStorage.getItem(storageKey);
  if (isLocale(stored)) return stored;
  return document.documentElement.lang.toLowerCase().startsWith("en")
    ? "en"
    : "hu";
}

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(storageKey, locale);
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function translateCurrent(
  key: TranslationKey,
  params?: TranslationParams,
) {
  return translate(initialLocale(), key, params);
}
