"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALE_COOKIE, formatDate, formatMoney, timeAgo, translate, translateCount,
  type Locale, type MessageKey, type Params,
} from "./translate";
import { errorText } from "./errors";

type I18n = {
  locale: Locale;
  t: (key: MessageKey, params?: Params) => string;
  /** Count forms: tn("orders.count", 3) uses orders.count_one / orders.count_other. */
  tn: (key: string, count: number, params?: Params) => string;
  date: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  money: (minor: number, currency?: string) => string;
  ago: (iso: string) => string;
  /** Text for a caught error: ours in the reader's language, the server's as written. */
  err: (cause: unknown, fallback: MessageKey) => string;
  setLocale: (locale: Locale) => void;
};

function build(locale: Locale, setLocale: (l: Locale) => void): I18n {
  return {
    locale,
    t: (key, params) => translate(locale, key, params),
    tn: (key, count, params) => translateCount(locale, key, count, params),
    date: (value, options) => formatDate(locale, value, options),
    money: (minor, currency) => formatMoney(locale, minor, currency),
    ago: iso => timeAgo(locale, iso),
    err: (cause, fallback) => errorText((key, params) => translate(locale, key, params), cause, fallback),
    setLocale,
  };
}

// Outside a provider (tests, static rendering) everything reads in English.
const I18nContext = createContext<I18n>(build("en", () => undefined));

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    // Server-rendered text and data fetched in the old language reload in the new one.
    router.refresh();
  }, [router]);
  const value = useMemo(() => build(locale, setLocale), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18n {
  return useContext(I18nContext);
}

/** Fixed language without the router, for tests and previews. */
export function StaticI18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => build(locale, () => undefined), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
