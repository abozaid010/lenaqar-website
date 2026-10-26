/** Title-case an English catalog token. Text that is already Arabic is unchanged. */
export function englishPlaceName(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (/[\u0600-\u06ff]/.test(raw)) return raw;
  return raw.replace(
    /(^|[\s/-])([a-z])/g,
    (_, sep, letter) => sep + letter.toUpperCase(),
  );
}

/**
 * Location tokens are stored in English, with a separate Arabic label.
 * The public site defaults to Arabic.
 *
 * @param {string} en
 * @param {string} ar
 * @param {string} [locale]
 */
export function localizedPlaceName(en, ar, locale = "ar") {
  const english = englishPlaceName(en);
  const arabic = typeof ar === "string" ? ar.trim() : "";
  if (locale === "en") return english || arabic;
  return arabic || english;
}
