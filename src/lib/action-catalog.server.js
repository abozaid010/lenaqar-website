import axiosInstance from "@/utils/axiosInstance";

/**
 * Server-side Action Catalog helpers (schedule SSR).
 * Not a "use server" actions module — sync helpers must stay plain exports.
 */

/**
 * @returns {Promise<import("@/types/actions").ActionCatalog|null>}
 */
export async function fetchActionCatalogServer() {
  try {
    const response = await axiosInstance.get("/action/catalog");
    const body = response.data;
    if (!body?.status || !body?.data?.actions) {
      console.warn(
        "[action-catalog.server] unexpected response:",
        body?.message
      );
      return null;
    }
    return body.data;
  } catch (error) {
    console.warn(
      "[action-catalog.server] fetch failed:",
      error?.response?.status || error?.message || error
    );
    return null;
  }
}

/**
 * @param {import("@/types/actions").ActionCatalog|null|undefined} catalog
 * @returns {string[]}
 */
export function getScheduledActionValuesFromCatalog(catalog) {
  if (!catalog?.actions?.length) return [];
  return catalog.actions
    .filter((a) => a.requires_meeting_time)
    .map((a) => a.value);
}
