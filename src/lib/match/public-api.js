import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import {
  LOWERCASE_UNIT_FILTER_KEYS,
  MATCH_UNITS_PAGE_SIZE,
} from "@/lib/match/requirement-to-units-filter";

function publicHeaders(extra = {}) {
  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
  if (PUBLIC_X_API_KEY) {
    headers["X-API-Key"] = PUBLIC_X_API_KEY;
  }
  return headers;
}

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
 * Fetch public units with filter params (no auth).
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
  const url = `${API_BASE_URL}/public/units${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: publicHeaders(),
    cache: "no-store",
  });

  const data = await parseJsonResponse(response);
  const units = Array.isArray(data?.units) ? data.units : [];
  const pagination = data?.pagination ?? {
    next_cursor: null,
    has_more_next: false,
  };
  return { units, pagination, count: data?.count ?? units.length };
}
