import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { knownPlaceAr } from "./listing-seo.js";
import { CATALOG_PLACES_AR } from "./places-catalog.js";
import { applyArabicLabels, indexArabicNames } from "./arabic-labels.js";

const TTL_MS = 60 * 60 * 1000;
const CATALOG_TIMEOUT_MS = 30_000;

const EMPTY_MAPS = {
  developers: new Map(),
  projects: new Map(),
};

/** @type {{ maps: { developers: Map<string, string>, projects: Map<string, string> } | null, fetchedAt: number, promise: Promise<{ developers: Map<string, string>, projects: Map<string, string> }> | null }} */
const cache = {
  maps: null,
  fetchedAt: 0,
  promise: null,
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
    const response = await bffFetch(`${API_BASE_URL}${path}`, {
      headers,
      cache: "no-store",
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

/**
 * Cached developer and project Arabic names. A failed fetch is not cached,
 * so the next request can try again. Places do not use this cache.
 */
export async function getArabicLabelMaps() {
  const now = Date.now();
  if (cache.maps && now - cache.fetchedAt < TTL_MS) return cache.maps;
  if (cache.promise) return cache.promise;

  cache.promise = loadMaps()
    .then((maps) => {
      const usable = maps.developers.size > 0 || maps.projects.size > 0;
      if (usable) {
        cache.maps = maps;
        cache.fetchedAt = Date.now();
      }
      cache.promise = null;
      return usable ? maps : cache.maps || EMPTY_MAPS;
    })
    .catch((error) => {
      cache.promise = null;
      console.warn(
        "[lenaqar] arabic name catalog error",
        error?.code || error?.message,
      );
      return cache.maps || EMPTY_MAPS;
    });

  return cache.promise;
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
