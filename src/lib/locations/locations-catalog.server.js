/**
 * Build + cache the CRM locations catalog (city → district → sub_district)
 * from market-index APIs. One in-memory copy per server process with TTL.
 *
 * Shape matches the CRM CityManager tree (city → districts → sub_districts).
 * Server-only module — import from route handlers / RSC only (uses axiosInstance).
 */

import axiosInstance from "@/utils/axiosInstance";
import {
  LOCATIONS_CATALOG_CONCURRENCY,
  LOCATIONS_CATALOG_TTL_MS,
} from "@/lib/locations/constants";

/** @type {{ data: object|null, fetchedAt: number, promise: Promise<object>|null }} */
const cache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

function unwrapLocations(res) {
  const payload = res?.data;
  if (payload?.status === true && payload?.data) {
    return Array.isArray(payload.data.locations) ? payload.data.locations : [];
  }
  return [];
}

function authConfig(token) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

/**
 * Path prefix for the location tree. The `/public/*` variant needs no bearer
 * token — axiosInstance's request interceptor attaches X-API-Key to any
 * `/public/*` URL automatically (see src/utils/axiosInstance.js).
 */
function locationsBasePath(usePublicEndpoint) {
  return usePublicEndpoint
    ? "/public/v1/market-index/locations"
    : "/market-index/locations";
}

async function fetchChildren(locationId, authToken, usePublicEndpoint) {
  const res = await axiosInstance.get(
    `${locationsBasePath(usePublicEndpoint)}/${encodeURIComponent(locationId)}/children`,
    usePublicEndpoint ? {} : authConfig(authToken),
  );
  return unwrapLocations(res);
}

/**
 * Run async work over items with a fixed concurrency limit.
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function mapPool(items, concurrency, worker) {
  if (!items.length) return [];
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run()
  );
  await Promise.all(runners);
  return results;
}

/**
 * Flatten nested sub_district children under a district into CityManager's flat list.
 * @param {object} node
 * @returns {Promise<object[]>}
 */
async function collectSubDistrictsFlat(node, authToken, usePublicEndpoint) {
  const childCount = node?.children_count ?? 0;
  if (node?.is_leaf === true && childCount <= 0) return [];

  const children = await fetchChildren(node.id, authToken, usePublicEndpoint);
  const flat = [];

  for (const child of children) {
    flat.push({
      en_name: child.en_name,
      ar_name: child.ar_name || "",
      aliases: Array.isArray(child.aliases) ? child.aliases : [],
    });
    const nestedCount = child.children_count ?? 0;
    if (child.is_leaf === false || nestedCount > 0) {
      const nested = await collectSubDistrictsFlat(child, authToken, usePublicEndpoint);
      flat.push(...nested);
    }
  }

  return flat;
}

/**
 * @returns {Promise<{ cities: object[], fetchedAt: string, source: string, count: object }>}
 */
async function buildLocationsCatalog(authToken, usePublicEndpoint) {
  const rootsRes = await axiosInstance.get(
    `${locationsBasePath(usePublicEndpoint)}/roots`,
    usePublicEndpoint ? {} : authConfig(authToken),
  );
  const cities = unwrapLocations(rootsRes);

  const tree = await mapPool(
    cities,
    LOCATIONS_CATALOG_CONCURRENCY,
    async (city) => {
      const districts = await fetchChildren(city.id, authToken, usePublicEndpoint);
      const districtNodes = await mapPool(
        districts,
        LOCATIONS_CATALOG_CONCURRENCY,
        async (district) => {
          const childCount = district.children_count ?? 0;
          const sub_districts =
            district.is_leaf === true && childCount <= 0
              ? []
              : await collectSubDistrictsFlat(district, authToken, usePublicEndpoint);

          return {
            en_name: district.en_name,
            ar_name: district.ar_name || "",
            aliases: Array.isArray(district.aliases) ? district.aliases : [],
            sub_districts,
          };
        }
      );

      return {
        // Keep en_name as id — matches stored CRM city values.
        id: city.en_name,
        en_name: city.en_name,
        ar_name: city.ar_name || "",
        alias: Array.isArray(city.aliases) ? city.aliases : [],
        location_id: city.id,
        districts: districtNodes,
      };
    }
  );

  tree.sort((a, b) =>
    String(a.en_name || "").localeCompare(String(b.en_name || ""), "en", {
      sensitivity: "base",
    })
  );

  const districtCount = tree.reduce(
    (n, c) => n + (c.districts?.length || 0),
    0
  );
  const subCount = tree.reduce(
    (n, c) =>
      n +
      (c.districts || []).reduce(
        (m, d) => m + (d.sub_districts?.length || 0),
        0
      ),
    0
  );

  return {
    cities: tree,
    fetchedAt: new Date().toISOString(),
    source: "market-index",
    count: {
      cities: tree.length,
      districts: districtCount,
      sub_districts: subCount,
    },
  };
}

export function peekLocationsCatalogCache() {
  if (!cache.data) return null;
  if (Date.now() - cache.fetchedAt > LOCATIONS_CATALOG_TTL_MS) return null;
  return cache.data;
}

export function clearLocationsCatalogCache() {
  cache.data = null;
  cache.fetchedAt = 0;
  cache.promise = null;
}

/**
 * Returns the catalog, building once per TTL window (shared across requests/users
 * and reused regardless of which caller warmed it — the underlying data is the
 * same tree either way).
 *
 * Requires either an authenticated server request context (Bearer via axios
 * cookies), an explicit `authToken`, or `usePublicEndpoint: true` to fetch via
 * the anonymous, API-key-only `/public/v1/market-index/locations/*` routes
 * (no login needed — see src/utils/axiosInstance.js's X-API-Key auto-attach).
 */
export async function getLocationsCatalog({ force = false, authToken, usePublicEndpoint = false } = {}) {
  if (!force) {
    const hit = peekLocationsCatalogCache();
    if (hit) return hit;
    if (cache.promise) return cache.promise;
  }

  cache.promise = buildLocationsCatalog(authToken, usePublicEndpoint)
    .then((data) => {
      cache.data = data;
      cache.fetchedAt = Date.now();
      cache.promise = null;
      return data;
    })
    .catch((error) => {
      cache.promise = null;
      throw error;
    });

  return cache.promise;
}
