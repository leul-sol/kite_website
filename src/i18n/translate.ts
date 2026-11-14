import { en } from "./en";
import { am } from "./am";

/** The portal's languages. English is the default; the choice is kept in a cookie. */
export const LOCALES = ["en", "am"] as const;
export type Locale = (typeof LOCALES)[number];
export type MessageKey = keyof typeof en;
export type Params = Record<string, string | number>;

export const LOCALE_COOKIE = "kite_locale";

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, am };

export function normalizeLocale(value: unknown): Locale {
  return value === "am" ? "am" : "en";
}

/** The text for a key in a language, with {placeholders} filled in. Falls back to English. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const text = DICTIONARIES[locale][key] ?? en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/**
 * English needs "1 booking" / "2 bookings"; Amharic uses one form. Pass the base key:
 * `${key}_one` is used for a count of 1 when it exists, otherwise `${key}_other`.
 */
export function translateCount(locale: Locale, key: string, count: number, params?: Params): string {
  const one = `${key}_one` as MessageKey, other = `${key}_other` as MessageKey;
  const chosen = count === 1 && one in en ? one : other;
  return translate(locale, chosen, { count, ...params });
}

const INTL_LOCALE: Record<Locale, string> = { en: "en-GB", am: "am-ET" };

/** Dates in the reader's language (Gregorian calendar, Amharic month names in Amharic). */
export function formatDate(locale: Locale, value: string | number | Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try { return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(date); }
  catch { return new Intl.DateTimeFormat("en-GB", options).format(date); }
}

/** "ETB 1,500.00" in English, "1,500.00 ብር" in Amharic. */
export function formatMoney(locale: Locale, minor: number, currency = "ETB"): string {
  const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
  if (currency !== "ETB") return `${currency} ${amount}`;
  return translate(locale, "money.etb", { amount });
}

/** "Just now", "5m ago", "3h ago", "2d ago", then the date. */
export function timeAgo(locale: Locale, iso: string, now = Date.now()): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "";
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return translate(locale, "time.justNow");
  if (minutes < 60) return translate(locale, "time.minutes", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(locale, "time.hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(locale, "time.days", { n: days });
  return formatDate(locale, at);
}
