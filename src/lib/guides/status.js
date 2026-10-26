/**
 * Editorial status workflow for Buyer Guide articles.
 * draft → needs_numbers → in_review → approved → scheduled → published
 */

export const GUIDE_STATUSES = [
  "draft",
  "needs_numbers",
  "in_review",
  "approved",
  "scheduled",
  "published",
];

/** Statuses that must never appear in public index / sitemap / llms.txt. */
export const PREVIEW_ONLY_STATUSES = new Set([
  "draft",
  "needs_numbers",
  "in_review",
]);

/**
 * @param {object} meta - front matter
 * @param {Date} [now]
 */
export function isPubliclyVisible(meta, now = new Date()) {
  if (!meta || !meta.status) return false;
  if (meta.status === "published") return true;
  if (meta.status === "approved" || meta.status === "scheduled") {
    if (!meta.date_planned) return false;
    const planned = new Date(meta.date_planned);
    if (Number.isNaN(planned.getTime())) return false;
    // Compare calendar dates in Cairo-ish UTC+3 by using date-only strings when possible.
    const plannedDay = String(meta.date_planned).slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    return plannedDay <= today;
  }
  return false;
}

export function isPreviewOnly(meta) {
  return !isPubliclyVisible(meta);
}
