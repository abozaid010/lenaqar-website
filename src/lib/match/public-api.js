import {
  LOWERCASE_UNIT_FILTER_KEYS,
  MATCH_UNITS_PAGE_SIZE,
} from "@/lib/match/requirement-to-units-filter";
import { mapSlimPublicUnitsPayload } from "@/lib/units/slim-unit-list-mapper";

// X-API-Key is added server-side by /api/crm/[...path]/route.js for /public/* paths.
// No key or backend URL in the client bundle.

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      body?.error_message ||
      body?.message ||
      body?.detail ||
      `Request failed (${response.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return body?.data ?? body;
}

/**
 * Fetch public units with filter params (no auth) — slim list payload.
 * Routes through the same-origin BFF catch-all (/api/crm/public/v1/slim-list)
 * so the backend URL never appears in the browser Network tab.
 */
export async function fetchPublicMatchedUnits(filters = {}) {
  const params = new URLSearchParams();
  params.set("page_size", String(filters.page_size ?? MATCH_UNITS_PAGE_SIZE));
  if (filters.cursor) params.set("cursor", String(filters.cursor));

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "page_size" || key === "cursor") return;
    if (value == null || value === "") return;
    let paramValue = String(value).trim();
    if (LOWERCASE_UNIT_FILTER_KEYS.has(key)) {
      paramValue = paramValue.toLowerCase();
    }
    params.set(key, paramValue);
  });

  const qs = params.toString();
  const url = `/api/crm/public/v1/slim-list${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });

  const data = await parseJsonResponse(response);
  const mapped = mapSlimPublicUnitsPayload(data);
  const units = mapped.units;
  const pagination = mapped.pagination ?? {
    next_cursor: null,
    has_more_next: false,
  };
  return { units, pagination, count: mapped.count ?? units.length };
}
