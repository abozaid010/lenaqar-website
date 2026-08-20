import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import { SITE, lenaqarInventoryQuery } from "@/config/site";

const TTL_MS = 60 * 60 * 1000;

/** @type {{ data: object[]|null, fetchedAt: number, promise: Promise<object[]>|null }} */
const cache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

function toSlimProject(row) {
  if (!row || typeof row !== "object") return null;
  const enName = String(row.project || row.en_name || row.name || "").trim();
  if (!enName) return null;
  return {
    id: row.project_id || row.id || enName,
    en_name: enName,
    ar_name: String(row.project_ar || row.projectAr || row.ar_name || "").trim(),
    city: String(row.city || "").trim(),
    district: String(row.district || "").trim(),
    sub_district: String(row.sub_district || row.subDistrict || "").trim(),
    developer: String(row.developer || row.developer_name || "").trim(),
  };
}

function uniqueProjects(rows) {
  const seen = new Map();
  for (const row of rows) {
    const project = toSlimProject(row);
    if (!project) continue;
    const key = project.en_name.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, project);
      continue;
    }
    if (!existing.developer && project.developer) {
      existing.developer = project.developer;
    }
  }
  return [...seen.values()];
}

async function fetchResaleUnitsPage(cursor) {
  const qs = new URLSearchParams();
  const query = {
    ...lenaqarInventoryQuery(),
    page_size: SITE.feed.pageSize,
    cursor,
  };
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    qs.set(key, String(value));
  }

  const headers = { accept: "application/json" };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

  const response = await bffFetch(`${API_BASE_URL}/public/v1/units?${qs}`, {
    headers,
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    if (isCloudflareChallenge(response, errBody)) {
      throw new Error("PROJECT_NAMES_FETCH_FAILED_CLOUDFLARE");
    }
    throw new Error(`PROJECT_NAMES_FETCH_FAILED_${response.status}`);
  }

  const json = await response.json();
  const units = json?.data?.units ?? json?.units ?? [];
  const pagination = json?.data?.pagination ?? json?.pagination ?? {};
  return {
    units: Array.isArray(units) ? units : [],
    pagination,
  };
}

async function fetchResaleProjectNames() {
  const collected = [];
  let cursor = null;

  for (let page = 0; page < SITE.feed.maxPages; page += 1) {
    const { units, pagination } = await fetchResaleUnitsPage(cursor);
    collected.push(...units);
    if (!pagination?.has_more_next || !pagination?.next_cursor) break;
    cursor = pagination.next_cursor;
  }

  return uniqueProjects(collected);
}

/**
 * Project names that actually have Homey resale sell units
 * (`is_primary=false`, `purpose=sell`, `client_id=homey`).
 */
export async function fetchLenaqarProjectNames() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < TTL_MS) return cache.data;
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    const list = await fetchResaleProjectNames();
    cache.data = list;
    cache.fetchedAt = Date.now();
    cache.promise = null;
    return list;
  })();

  try {
    return await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}

const catalogCache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

/** `/public/projects` is ~4MB; allow slower networks than the default BFF timeout. */
const PUBLIC_PROJECTS_TIMEOUT_MS = 30_000;

function unwrapProjectRows(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.projects)) return body.data.projects;
  if (Array.isArray(body?.projects)) return body.projects;
  return [];
}

/**
 * @param {string} path
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<object[]|null>} rows on success, null on HTTP/network failure
 */
async function fetchCatalogJson(path, { timeoutMs } = {}) {
  const headers = { accept: "application/json" };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;
  try {
    // Own module cache only — `/public/projects` exceeds Next's 2MB fetch cache.
    const response = await bffFetch(`${API_BASE_URL}${path}`, {
      headers,
      cache: "no-store",
      ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    });
    if (!response.ok) {
      console.warn(
        `[lenaqar] catalog fetch ${path} failed`,
        response.status,
      );
      return null;
    }
    const body = await response.json().catch(() => null);
    return unwrapProjectRows(body);
  } catch (error) {
    console.warn(
      `[lenaqar] catalog fetch ${path} error`,
      error?.code || error?.message,
    );
    return null;
  }
}

/**
 * Full public compound list for buy/sell forms.
 * Prefer the slim `projects_names` endpoint when the backend allows anonymous
 * access; otherwise fall back to `/public/projects` and keep only name fields
 * in memory (never cache the full dump).
 */
export async function fetchPublicCatalogProjectNames() {
  const now = Date.now();
  if (catalogCache.data && now - catalogCache.fetchedAt < TTL_MS) {
    return catalogCache.data;
  }
  if (catalogCache.promise) return catalogCache.promise;

  catalogCache.promise = (async () => {
    let rows = await fetchCatalogJson(
      "/projects/v3/projects_names?public=true",
    );
    if (!rows?.length) {
      rows = await fetchCatalogJson("/public/projects", {
        timeoutMs: PUBLIC_PROJECTS_TIMEOUT_MS,
      });
    }

    const list = uniqueProjects(rows || []);
    // Only cache successful non-empty results so a 401/empty miss can retry.
    if (list.length > 0) {
      catalogCache.data = list;
      catalogCache.fetchedAt = Date.now();
    }
    catalogCache.promise = null;
    return list;
  })();

  try {
    return await catalogCache.promise;
  } catch (error) {
    catalogCache.promise = null;
    throw error;
  }
}
