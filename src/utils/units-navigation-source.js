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
  if (!pathname) return null;
  // Support both /units/* and /{clientId}/units/* URL patterns
  const isUnitsPath = pathname.startsWith("/units") || /^\/[^/]+\/units/.test(pathname);
  if (!isUnitsPath) return null;
  const isPendingPath =
    pathname.startsWith("/units/pending-approval") ||
    /^\/[^/]+\/units\/pending-approval/.test(pathname);
  if (isPendingPath) return "pending_approval";
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

/** Admin hidden-units list path: /{clientId}/units/pending-approval or /units/pending-approval */
export function buildAdminPendingApprovalListPath(clientId) {
  return clientId ? `/${clientId}/units/pending-approval` : "/units/pending-approval";
}

/** Admin units list path: /{clientId}/units or /units */
export function buildAdminUnitsListPath(clientId) {
  return clientId ? `/${clientId}/units` : "/units";
}

/**
 * Safe fallback list path for the given section (used when the exact origin is unknown).
 * @param {'units'|'pending_approval'} section
 */
export function buildUnitsListPathForSection(section, clientId) {
  return section === "pending_approval"
    ? buildAdminPendingApprovalListPath(clientId)
    : buildAdminUnitsListPath(clientId);
}

/**
 * Guard against open-redirects / external URLs: only allow same-origin relative
 * paths (e.g. "/units?query=..."), never protocol-relative ("//evil.com") or absolute URLs.
 * @param {unknown} path
 * @returns {boolean}
 */
export function isSafeInternalPath(path) {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://")
  );
}

/** sessionStorage key holding the list URL + section the user last opened a unit from. */
export const UNITS_LIST_ORIGIN_STORAGE_KEY = "lenaai.unitsListOrigin";

/**
 * Remember which list (URL + section) the user opened a unit from, so the edit flow
 * can return there with its state preserved (filters/search/pagination live in the URL).
 * Safe no-op on the server or for unsafe/external URLs.
 *
 * @param {{ url: string, section: 'units'|'pending_approval'|null }} origin
 */
export function rememberUnitsListOrigin({ url, section } = {}) {
  if (typeof window === "undefined") return;
  if (!isSafeInternalPath(url) || !section) return;
  try {
    window.sessionStorage.setItem(
      UNITS_LIST_ORIGIN_STORAGE_KEY,
      JSON.stringify({ url, section })
    );
  } catch {
    // sessionStorage may be unavailable (private mode / quota) — degrade to fallback nav.
  }
}

/**
 * Read and clear the remembered list origin, but only when it matches the section we
 * are returning to (prevents a hidden-unit edit from landing on the normal units list).
 * Returns the exact origin URL to navigate back to, or null to use a fallback.
 *
 * @param {'units'|'pending_approval'} expectedSection
 * @returns {string|null}
 */
export function consumeUnitsListOrigin(expectedSection) {
  if (typeof window === "undefined") return null;
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(UNITS_LIST_ORIGIN_STORAGE_KEY);
    window.sessionStorage.removeItem(UNITS_LIST_ORIGIN_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.section !== expectedSection) return null;
    return isSafeInternalPath(parsed?.url) ? parsed.url : null;
  } catch {
    return null;
  }
}

/** Append ?pending=1 when linking from the hidden-units section. */
export function appendUnitsSourcePendingQuery(path, fromPendingApproval) {
  if (!fromPendingApproval) return path;
  const query = unitsSourcePendingQueryString(true);
  if (!query) return path;
  return path.includes("?") ? `${path}&${query.slice(1)}` : `${path}${query}`;
}
