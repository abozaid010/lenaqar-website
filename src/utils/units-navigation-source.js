/**
 * Single source of truth for "units" vs "pending approval" context when viewing
 * unit list, unit detail, or edit unit (modal). Used by Sidebar and any links
 * that need to preserve the source (e.g. unit detail/edit opened from pending approval).
 */

/** Query param: when present (e.g. "?pending=1"), treat the page as "from pending approval" for sidebar and back navigation */
export const UNITS_SOURCE_PENDING_PARAM = "pending";

/**
 * Resolve which units section is active from the current URL.
 * Use for sidebar highlighting and for building links that preserve source.
 *
 * @param {string} pathname - Current pathname (e.g. from usePathname())
 * @param {URLSearchParams|{ get: (k: string) => string | null }|null} searchParams - Current search params
 * @returns {'units'|'pending_approval'|null} - Active section, or null if not in units area
 */
export function getUnitsSectionFromUrl(pathname, searchParams) {
  if (!pathname?.startsWith?.("/units")) return null;
  if (pathname.startsWith("/units/pending-approval")) return "pending_approval";
  if (searchParams?.get?.(UNITS_SOURCE_PENDING_PARAM) === "1") return "pending_approval";
  return "units";
}

/**
 * Build query string to preserve "from pending approval" when linking to unit detail or edit.
 * Use when linking from the pending approval list so sidebar and back behavior stay correct.
 *
 * @returns {string} - e.g. "?pending=1" or ""
 */
export function unitsSourcePendingQueryString(fromPendingApproval) {
  return fromPendingApproval ? `?${UNITS_SOURCE_PENDING_PARAM}=1` : "";
}
