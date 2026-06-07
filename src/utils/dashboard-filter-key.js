import { normalizeSearchQueryForApi } from "@/utils/lead-list-search";

/** URL params that must not be sent to GET messages/v2/all */
const DASHBOARD_NON_API_PARAMS = new Set([
  "userId",
  "cursor",
  "direction",
  "tab",
  "clientId",
]);

/**
 * Build a stable JSON filter key for dashboard leads queries from URL search params.
 * @param {URLSearchParams | { entries?: () => Iterable<[string, string]> } | Record<string, string | string[] | undefined> | null | undefined} searchParams
 * @returns {string}
 */
export function buildDashboardFilterKey(searchParams) {
  let entries = [];

  if (!searchParams) {
    return "{}";
  }

  if (typeof searchParams.entries === "function") {
    entries = Array.from(searchParams.entries());
  } else if (typeof searchParams === "object") {
    entries = Object.entries(searchParams).flatMap(([key, value]) => {
      if (value == null || value === "") return [];
      if (Array.isArray(value)) {
        return value.filter((v) => v != null && v !== "").map((v) => [key, String(v)]);
      }
      return [[key, String(value)]];
    });
  }

  const o = Object.fromEntries(entries);

  for (const key of DASHBOARD_NON_API_PARAMS) {
    delete o[key];
  }

  if (o.query && typeof o.query === "string") {
    const trimmed = o.query.trim();
    if (!trimmed) {
      delete o.query;
    } else {
      o.query = normalizeSearchQueryForApi(trimmed);
    }
  }

  return JSON.stringify(o);
}
