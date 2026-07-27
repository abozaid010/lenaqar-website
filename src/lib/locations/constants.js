/** Shared keys / TTL for the locations catalog cache. */

/** sessionStorage key — survives SPA navigations + reload within the same tab session. */
export const LOCATIONS_CATALOG_STORAGE_KEY = "lena.locations.catalog.v1";

/** Server in-memory TTL (ms). Catalog is global approved data — safe to share across tenants. */
export const LOCATIONS_CATALOG_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Max concurrent children fetches when building the tree. */
export const LOCATIONS_CATALOG_CONCURRENCY = 8;
