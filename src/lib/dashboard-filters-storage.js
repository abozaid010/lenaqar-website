import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { applyDashboardLeadAccessDefaults } from "@/lib/dashboard-lead-access";
import {
  getDefaultDashboardEndDate,
  getDefaultDashboardStartDate,
  isDashboardDateBeforeToday,
} from "@/utils/dashboardDate";
import {
  DASHBOARD_SORT,
  DASHBOARD_SORT_PARAM,
  LEGACY_SORT_SCORE_PARAM,
  getDefaultDashboardSort,
  normalizeDashboardSort,
} from "@/utils/dashboard-lead-sort";

/** Bump when the persisted filter shape becomes incompatible. */
export const DASHBOARD_FILTERS_STORAGE_VERSION = 1;

const STORAGE_KEY_PREFIX = "dashboard-filters:";

/** Tenant that defaults dashboard sort to Oldest First. */
export const HOMEY_CLIENT_ID = "homey";

/** URL params that are navigation/UI state, not dashboard filters. */
export const DASHBOARD_NON_FILTER_PARAMS = new Set([
  "userId",
  "cursor",
  "direction",
  "tab",
  "clientId",
]);

/**
 * @param {string | null | undefined} clientId
 * @returns {boolean}
 */
export function isHomeyClientId(clientId) {
  return String(clientId || "").trim().toLowerCase() === HOMEY_CLIENT_ID;
}

/**
 * Migrate legacy `sort_score` into `sort` when present.
 * @param {Record<string, string>} filters
 * @returns {Record<string, string>}
 */
function normalizePersistedSortParams(filters) {
  const next = { ...filters };
  const normalized = normalizeDashboardSort(
    next[DASHBOARD_SORT_PARAM],
    next[LEGACY_SORT_SCORE_PARAM],
  );
  delete next[LEGACY_SORT_SCORE_PARAM];
  if (normalized) {
    next[DASHBOARD_SORT_PARAM] = normalized;
  } else {
    delete next[DASHBOARD_SORT_PARAM];
  }
  return next;
}

/**
 * Fill dashboard filter defaults when unset.
 * - Author: non-admin/non-owner users are always restricted to their own email
 *   (all tenants). Admins/owners stay unrestricted.
 * - Status: optional default `action=new` on first visit / Reset.
 * - Sort: Homey only — Oldest First when sort was never set.
 *
 * @param {Record<string, string> | null | undefined} filters
 * @param {{
 *   applyStatusDefault?: boolean,
 *   enforceAuthor?: boolean,
 * }} [options]
 * @returns {Record<string, string>}
 */
export function withDashboardFilterDefaults(
  filters,
  { applyStatusDefault = false, enforceAuthor = true } = {},
) {
  const next =
    filters && typeof filters === "object"
      ? normalizePersistedSortParams({ ...filters })
      : {};
  if (typeof window === "undefined") return next;

  const withAccess = applyDashboardLeadAccessDefaults(next, {
    applyStatusDefault,
    enforceAuthor,
  });

  const clientId = LenaCookiesManager.getClientId();
  if (isHomeyClientId(clientId)) {
    const existingSort = normalizeDashboardSort(
      withAccess[DASHBOARD_SORT_PARAM],
      undefined,
    );
    if (!existingSort) {
      withAccess[DASHBOARD_SORT_PARAM] =
        getDefaultDashboardSort(clientId) || DASHBOARD_SORT.OLDEST;
    }
  }

  // Rolling date window: start = ~2 months ago, end = tomorrow EOD (covers today).
  // Refresh a stale end_date that ended before today so reloads still include
  // current leads (matches the date-picker default of "tomorrow").
  if (!withAccess.start_date) {
    withAccess.start_date = getDefaultDashboardStartDate();
  }
  if (!withAccess.end_date || isDashboardDateBeforeToday(withAccess.end_date)) {
    withAccess.end_date = getDefaultDashboardEndDate();
  }

  return withAccess;
}

/**
 * @deprecated Use {@link withDashboardFilterDefaults}.
 * @param {Record<string, string> | null | undefined} filters
 * @param {{ applyStatusDefault?: boolean, enforceAuthor?: boolean }} [options]
 * @returns {Record<string, string>}
 */
export function withHomeyOnlyMyLeadsDefault(filters, options = {}) {
  return withDashboardFilterDefaults(filters, options);
}

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
  return normalizePersistedSortParams(filters);
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
    const normalized = normalizePersistedSortParams(filters);
    return Object.keys(normalized).length > 0 ? normalized : null;
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
    // Never wipe storage on empty writes — only clearDashboardFilters /
    // logout should remove. Keeps reload / bare /dashboard restores intact.
    if (Object.keys(persistable).length === 0) {
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
