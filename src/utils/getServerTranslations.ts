import { loadLocaleMessages } from "@/lib/i18n/load-locale-messages";

type LocaleMessages = Record<string, unknown>;

/**
 * Server-only: load a single locale dictionary (no dual-language import).
 */
export async function getServerTranslations(
  locale: string
): Promise<{ t: LocaleMessages; locale: string }> {
  const normalized = locale === "en" ? "en" : "ar";
  const t = await loadLocaleMessages(normalized);
  return { t, locale: normalized };
}
