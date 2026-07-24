"use client";

import {
  LOWERCASE_UNIT_FILTER_KEYS,
  MATCH_UNITS_PAGE_SIZE,
} from "@/lib/match/requirement-to-units-filter";
import { fetchUnitsFilter } from "@/utils/api";

/**
 * Normalize share `unit_filters` into the same query shape the Units page uses
 * for GET /units/v1/slim-list (via fetchUnitsFilter).
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
 * Fetch matched units with the same slim-list API as the Units page.
 * Uses `/units/v1/slim-list` through `fetchUnitsFilter` (BFF: /api/crm/...).
 */
export async function fetchPublicMatchedUnits(filters = {}) {
  const params = normalizeMatchUnitFilters(filters);
  const response = await fetchUnitsFilter(params);
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
