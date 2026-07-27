/**
 * Client helpers to clear locations catalog caches after login/logout/mutations.
 */

import { LOCATIONS_CATALOG_STORAGE_KEY } from "@/lib/locations/constants";

export function clearLocationsCatalogSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LOCATIONS_CATALOG_STORAGE_KEY);
  } catch {
    // private mode / quota
  }
}

/**
 * Drop client memory + sessionStorage and ask the server to drop its TTL cache.
 */
export async function invalidateLocationsCatalogClient() {
  clearLocationsCatalogSessionStorage();

  try {
    const CityManager = (await import("@/utils/city_manager")).default;
    CityManager.getInstance().reset();
  } catch {
    // CityManager may not be loaded yet
  }

  try {
    await fetch("/api/locations/catalog", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // best-effort
  }
}
