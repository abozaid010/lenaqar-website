import { normalizeSearchQueryForApi } from "@/utils/lead-list-search";

/** URL params that must not be sent to GET messages/v2/all */
const DASHBOARD_NON_API_PARAMS = new Set([
  "userId",
  "cursor",
  "direction",
  "tab",
  "clientId",
  "sort",
  "sort_score",
]);

/**
 * Exact-match params the API accepts as a single value only (breaking
 * change — no more comma-separated lists). Only the first value is kept,
 * so legacy bookmarked/shared links degrade gracefully instead of sending
 * a list the API no longer understands.
 */
const DASHBOARD_SINGLE_VALUE_PARAMS = ["author", "source", "owner_type", "campaign_id"];

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

  // Legacy bookmarks/links may still use `campaign_ids` — migrate to the
  // current `campaign_id` param name.
  if (o.campaign_ids && !o.campaign_id) {
    o.campaign_id = o.campaign_ids;
  }
  delete o.campaign_ids;

  for (const key of DASHBOARD_SINGLE_VALUE_PARAMS) {
    if (typeof o[key] === "string" && o[key].includes(",")) {
      o[key] = o[key].split(",")[0];
    }
  }

  if (o.query && typeof o.query === "string") {
    const trimmed = o.query.trim();
    if (!trimmed) {
      delete o.query;
    } else {
      // Search is exclusive: while active, send only `query` to the API.
      // Other filters stay in the URL/UI and resume unchanged when search clears.
      return JSON.stringify({
        query: normalizeSearchQueryForApi(trimmed),
      });
    }
  }

  // Stable key order so URLSearchParams vs plain-object sources don't refetch.
  const sorted = Object.keys(o)
    .sort()
    .reduce((acc, key) => {
      acc[key] = o[key];
      return acc;
    }, {});

  return JSON.stringify(sorted);
}
