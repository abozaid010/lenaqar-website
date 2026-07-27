import { fetchCampaignNamesOnly, fetchCampaigns } from "@/utils/api";

/** @type {'unset'|'ok'} */
let cacheKind = "unset";
/** @type {string[]|null} */
let cachedIds = null;
/** @type {Promise<string[]|null>|null} */
let inFlight = null;

/**
 * @param {unknown} campaigns
 * @returns {string[]}
 */
function campaignIdsFromListPayload(campaigns) {
  if (!Array.isArray(campaigns)) return [];
  return campaigns
    .map((c) => (typeof c === "string" ? c : c?.id || c?.campaign_id))
    .filter((id) => typeof id === "string" && id.trim() !== "");
}

/**
 * Loads campaign ids once per successful browser session (SPA lifetime).
 * Concurrent callers share the same in-flight request.
 * Transient failures are not cached, so a later mount can retry.
 * @returns {Promise<string[]|null>} ids on success (may be empty), or null if all sources failed (use localStorage fallback)
 */
export async function loadDashboardCampaignIdsOnce() {
  if (cacheKind === "ok") return cachedIds;
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const ids = await fetchCampaignNamesOnly({ limit: 50, offset: 0 });
        cachedIds = Array.isArray(ids) ? ids : [];
        cacheKind = "ok";
        return cachedIds;
      } catch (namesErr) {
        try {
          const list = await fetchCampaigns({ limit: 50, offset: 0 });
          cachedIds = campaignIdsFromListPayload(list?.campaigns);
          cacheKind = "ok";
          return cachedIds;
        } catch {
          console.warn(
            "[dashboard] campaign names_only/list failed; filter will use localStorage fallback",
            namesErr?.message ?? namesErr
          );
          return null;
        }
      } finally {
        inFlight = null;
      }
    })();
  }
  return inFlight;
}
