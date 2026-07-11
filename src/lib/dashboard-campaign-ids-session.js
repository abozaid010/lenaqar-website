import { fetchCampaignNamesOnly } from "@/utils/api";

/** @type {'unset'|'ok'|'error'} */
let cacheKind = "unset";
/** @type {string[]|null} */
let cachedIds = null;
/** @type {Promise<string[]|null>|null} */
let inFlight = null;

/**
 * Loads campaign ids from GET /campaign/names_only once per browser session (SPA lifetime).
 * Concurrent callers share the same in-flight request.
 * @returns {Promise<string[]|null>} ids on success (may be empty), or null if the request failed (use localStorage fallback)
 */
export async function loadDashboardCampaignIdsOnce() {
  if (cacheKind === "ok") return cachedIds;
  if (cacheKind === "error") return null;
  if (!inFlight) {
    inFlight = fetchCampaignNamesOnly({ limit: 50, offset: 0 })
      .then((ids) => {
        cachedIds = Array.isArray(ids) ? ids : [];
        cacheKind = "ok";
        return cachedIds;
      })
      .catch((err) => {
        console.error(
          "[dashboard] campaign names_only failed; filter will use localStorage fallback",
          err?.message ?? err
        );
        cacheKind = "error";
        cachedIds = null;
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
