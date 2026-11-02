/**
 * Search-index trust rules for Buyer Guides.
 * Pages with [[VERIFY]] / «مسودة» must not be indexed (still HTTP 200).
 */

const VERIFY_RE = /\[\[\s*VERIFY\b/i;
/** Editorial draft labels — not every casual use of the Arabic word. */
const DRAFT_RE =
  /مسودة\s*لينا|مسودة\s*حذرة|مسودة\s*تحرير|جدول[^\n]{0,40}مسودة|##[^\n]{0,40}مسودة|description:[^\n]*مسودة/i;

export function guideTextBlob(guide) {
  if (!guide) return "";
  const sources = Array.isArray(guide.sources)
    ? guide.sources.map((s) => `${s?.name || ""} ${s?.url || ""}`).join("\n")
    : "";
  const faq = Array.isArray(guide.faq)
    ? guide.faq.map((f) => `${f?.q || ""} ${f?.a || ""}`).join("\n")
    : "";
  return [
    guide.title,
    guide.h1,
    guide.description,
    guide.body,
    sources,
    faq,
  ]
    .filter(Boolean)
    .join("\n");
}

export function hasUnverifiedMarkers(guide) {
  const blob = guideTextBlob(guide);
  return VERIFY_RE.test(blob) || DRAFT_RE.test(blob);
}

/**
 * Indexable in Google/AI search: publicly visible, not forced off, no draft markers.
 */
export function isSearchIndexable(guide) {
  if (!guide) return false;
  if (guide.seo_index === false || guide.seo_index === "false") return false;
  if (hasUnverifiedMarkers(guide)) return false;
  return true;
}
