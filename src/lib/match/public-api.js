"use client";

import {
  LOWERCASE_UNIT_FILTER_KEYS,
  MATCH_UNITS_PAGE_SIZE,
} from "@/lib/match/requirement-to-units-filter";
import { fetchUnitsFilter } from "@/utils/api";

/**
 * Normalize share `unit_filters` into the same query shape public listings use
 * for GET /public/v1/slim-list (via fetchUnitsFilter with usePublicEndpoint).
 */
function normalizeMatchUnitFilters(filters = {}) {
  const params = {
    page_size: filters.page_size ?? MATCH_UNITS_PAGE_SIZE,
  };

  if (filters.cursor) params.cursor = String(filters.cursor);

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "page_size" || key === "cursor") return;
    if (value == null || value === "") return;

    // Backend may return multi-value filters as arrays (e.g. district: ["new cairo"]).
    const raw = Array.isArray(value)
      ? value.filter((v) => v != null && v !== "").map(String).join(",")
      : String(value).trim();
    if (!raw) return;

    params[key] = LOWERCASE_UNIT_FILTER_KEYS.has(key) ? raw.toLowerCase() : raw;
  });

  return params;
}

/**
 * Fetch matched units for the public share page (no login).
 * Uses `/public/v1/slim-list` so privacy fields stay off the payload and
 * unauthenticated visitors are not bounced to login by the CRM BFF.
 */
export async function fetchPublicMatchedUnits(filters = {}) {
  const params = normalizeMatchUnitFilters(filters);
  const response = await fetchUnitsFilter(params, { usePublicEndpoint: true });
  const units = response?.data?.units ?? [];
  const pagination = response?.data?.pagination ?? {
    next_cursor: null,
    has_more_next: false,
  };
  return {
    units,
    pagination,
    count: response?.data?.count ?? units.length,
  };
}
