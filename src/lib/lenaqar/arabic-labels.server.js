import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { knownPlaceAr } from "./listing-seo.js";
import { CATALOG_PLACES_AR } from "./places-catalog.js";
import { applyArabicLabels, indexArabicNames } from "./arabic-labels.js";
import { sharedSwrMemo } from "./swr-memo.js";

const TTL_MS = 60 * 60 * 1000;
/** Names change rarely: a stale map beats no Arabic labels while the API is down. */
const MAX_STALE_MS = 30 * 24 * 60 * 60 * 1000;
const CATALOG_TIMEOUT_MS = 30_000;

const EMPTY_MAPS = {
  developers: new Map(),
  projects: new Map(),
};

function unwrapRows(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.projects)) return body.data.projects;
  if (Array.isArray(body?.projects)) return body.projects;
  return [];
}

/**
 * @param {string} path
 * @returns {Promise<object[]>}
 */
async function fetchRows(path) {
  if (!PUBLIC_X_API_KEY) return [];
  const headers = { accept: "application/json", "X-API-Key": PUBLIC_X_API_KEY };
  try {
    // `next.internal` bypasses Next's fetch cache and its static/dynamic
    // bookkeeping. Not `no-store`: these run inside ISR routes
    // (/opportunities/[slug], sitemap), where a no-store fetch at runtime makes
    // Next answer HTTP 500 ("Page changed from static to dynamic at runtime").
    // Not `revalidate` either: /public/projects (~6 MB) is over the 2 MB
    // data-cache limit, so Next refetched it on every call. The memo below
    // keeps only the name maps (a few hundred KB), stale-while-revalidate.
    const response = await bffFetch(`${API_BASE_URL}${path}`, {
      headers,
      next: { internal: true },
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn("[lenaqar] arabic name catalog failed", path, response.status);
      return [];
    }
    const body = await response.json().catch(() => null);
    return unwrapRows(body);
  } catch (error) {
    console.warn(
      "[lenaqar] arabic name catalog error",
      path,
      error?.code || error?.message,
    );
    return [];
  }
}

async function loadMaps() {
  const [developers, projects] = await Promise.all([
    fetchRows("/public/developers"),
    fetchRows("/public/projects"),
  ]);

  return {
    developers: indexArabicNames(
      developers.map((row) => ({
        en: [row?.en_name, row?.name],
        ar: row?.ar_name,
      })),
    ),
    projects: indexArabicNames(
      projects.map((row) => ({
        en: row?.en_name,
        ar: row?.ar_name,
      })),
    ),
  };
}

async function loadUsableMaps() {
  const maps = await loadMaps();
  if (maps.developers.size === 0 && maps.projects.size === 0) {
    // Thrown so the memo neither caches nor replaces good maps with nothing.
    throw new Error("arabic name catalogs returned no rows");
  }
  return maps;
}

const MAPS_KEY = "maps";

const mapsMemo = sharedSwrMemo("arabic-label-maps", {
  load: loadUsableMaps,
  freshMs: TTL_MS,
  maxStaleMs: MAX_STALE_MS,
  maxEntries: 1,
  onBackgroundError: (error) => {
    console.warn("[lenaqar] arabic name catalog refresh failed", error?.message);
  },
});

/**
 * Cached developer and project Arabic names, stale-while-revalidate: after the
 * first load, callers never wait on the ~6 MB /public/projects download. A
 * failed load is not cached, so the next call retries. Never throws; without
 * any maps yet it returns empty ones. Places do not use this cache.
 */
export async function getArabicLabelMaps() {
  try {
    return await mapsMemo.get(MAPS_KEY);
  } catch (error) {
    console.warn("[lenaqar] arabic name catalog error", error?.code || error?.message);
    return EMPTY_MAPS;
  }
}

/** Start loading the name maps without waiting (server boot). */
export function warmArabicLabelMaps() {
  mapsMemo.warm(MAPS_KEY);
}

/** Hand-tuned place names win; the locations catalog fills the rest. */
export function catalogPlaceAr(value) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!key) return "";
  return knownPlaceAr(key) || CATALOG_PLACES_AR[key] || "";
}

export async function enrichOpportunityLabels(unit) {
  if (!unit) return unit;
  const maps = await getArabicLabelMaps();
  return applyArabicLabels(unit, { ...maps, placeAr: catalogPlaceAr });
}
