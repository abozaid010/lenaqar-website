/**
 * Lazy locale message loader with in-memory cache.
 * Arabic is primed by I18nProvider; English is downloaded only on demand.
 */

const cache = new Map();

export function primeLocaleMessagesCache(locale, messages) {
  const lang = locale === "en" ? "en" : "ar";
  if (messages) cache.set(lang, messages);
}

export function getCachedLocaleMessages(locale) {
  const lang = locale === "en" ? "en" : "ar";
  return cache.get(lang) ?? null;
}

export async function loadLocaleMessages(locale) {
  const lang = locale === "en" ? "en" : "ar";
  if (cache.has(lang)) return cache.get(lang);

  const mod =
    lang === "en"
      ? await import("../../../public/locales/public-en.js")
      : await import("../../../public/locales/public-ar.js");

  const messages = mod.default ?? mod;
  cache.set(lang, messages);
  return messages;
}
