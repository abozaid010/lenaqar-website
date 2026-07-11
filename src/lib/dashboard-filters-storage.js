import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

/** Bump when the persisted filter shape becomes incompatible. */
export const DASHBOARD_FILTERS_STORAGE_VERSION = 1;

const STORAGE_KEY_PREFIX = "dashboard-filters:";

/** URL params that are navigation/UI state, not dashboard filters. */
export const DASHBOARD_NON_FILTER_PARAMS = new Set([
  "userId",
  "cursor",
  "direction",
  "tab",
  "clientId",
]);

/**
 * @param {string | null | undefined} email
 * @returns {string | null}
 */
export function getDashboardFiltersStorageKey(email) {
  const normalized =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalized) return null;
  return `${STORAGE_KEY_PREFIX}${normalized}`;
}

/**
 * Storage key for the currently logged-in user (client-only).
 * @returns {string | null}
 */
export function getCurrentUserDashboardFiltersStorageKey() {
  if (typeof window === "undefined") return null;
  const email = LenaCookiesManager.getClientInfo()?.email;
  return getDashboardFiltersStorageKey(email);
}

/**
 * @param {URLSearchParams | Record<string, string | string[] | undefined> | null | undefined} searchParams
 * @returns {Record<string, string>}
 */
export function extractPersistableDashboardFilters(searchParams) {
  if (!searchParams) return {};

  let entries = [];
  if (typeof searchParams.entries === "function") {
    entries = Array.from(searchParams.entries());
  } else if (typeof searchParams === "object") {
    entries = Object.entries(searchParams).flatMap(([key, value]) => {
      if (value == null || value === "") return [];
      if (Array.isArray(value)) {
        return value
          .filter((v) => v != null && v !== "")
          .map((v) => [key, String(v)]);
      }
      return [[key, String(value)]];
    });
  }

  /** @type {Record<string, string>} */
  const filters = {};
  for (const [key, value] of entries) {
    if (DASHBOARD_NON_FILTER_PARAMS.has(key)) continue;
    if (value == null || value === "") continue;
    filters[key] = String(value);
  }
  return filters;
}

/**
 * @param {URLSearchParams | Record<string, string | string[] | undefined> | null | undefined} searchParams
 */
export function hasPersistableDashboardFilters(searchParams) {
  return Object.keys(extractPersistableDashboardFilters(searchParams)).length > 0;
}

/**
 * @param {Record<string, string>} filters
 * @returns {string}
 */
export function dashboardFiltersToQueryString(filters) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value == null || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
}

/**
 * @param {string | null} storageKey
 * @returns {Record<string, string> | null}
 */
export function readDashboardFilters(storageKey) {
  if (typeof window === "undefined" || !storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      parsed.version !== DASHBOARD_FILTERS_STORAGE_VERSION ||
      !parsed.filters ||
      typeof parsed.filters !== "object" ||
      Array.isArray(parsed.filters)
    ) {
      localStorage.removeItem(storageKey);
      return null;
    }

    /** @type {Record<string, string>} */
    const filters = {};
    for (const [key, value] of Object.entries(parsed.filters)) {
      if (DASHBOARD_NON_FILTER_PARAMS.has(key)) continue;
      if (value == null || value === "") continue;
      filters[key] = String(value);
    }
    return Object.keys(filters).length > 0 ? filters : null;
  } catch {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * @param {string | null} storageKey
 * @param {Record<string, string>} filters
 */
export function writeDashboardFilters(storageKey, filters) {
  if (typeof window === "undefined" || !storageKey) return;
  try {
    const persistable = extractPersistableDashboardFilters(filters);
    if (Object.keys(persistable).length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: DASHBOARD_FILTERS_STORAGE_VERSION,
        filters: persistable,
      }),
    );
  } catch {
    // localStorage may be unavailable — degrade silently
  }
}

/**
 * @param {string | null} storageKey
 */
export function clearDashboardFilters(storageKey) {
  if (typeof window === "undefined" || !storageKey) return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

/** Clears persisted dashboard filters for the current logged-in user. */
export function clearDashboardFiltersForCurrentUser() {
  clearDashboardFilters(getCurrentUserDashboardFiltersStorageKey());
}
