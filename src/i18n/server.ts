import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, translate, type Locale, type MessageKey, type Params } from "./translate";

/** The visitor's chosen language, for server components. */
export async function getLocale(): Promise<Locale> {
  return normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

/** A translator for server components. */
export async function getT() {
  const locale = await getLocale();
  return { locale, t: (key: MessageKey, params?: Params) => translate(locale, key, params) };
}
