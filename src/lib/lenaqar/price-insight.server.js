import axiosInstance from "@/utils/axiosInstance";
import { catalogPlaceAr } from "@/lib/lenaqar/arabic-labels.server";
import { priceInsightQuery, toPriceInsightView } from "@/lib/lenaqar/price-insight";

// The success screen is already on screen while this loads; a slow answer is dropped.
const PRICE_INSIGHT_TIMEOUT_MS = 8000;
const PRICE_INSIGHT_ATTEMPTS = 2;

/**
 * Average asking prices for a submitted buy request, via the anonymous,
 * API-key-only `/public/v1/price-insight` route.
 *
 * Never throws: no city or property type, too few listed units, a slow or
 * failing backend all return `null`, and the card simply shows no price block.
 */
export async function loadPriceInsight(requirement) {
  const params = priceInsightQuery(requirement);
  if (!params) return null;
  // One retry for a failure that can pass on its own (timeout, network, 5xx). A 4xx
  // is an answer — a missing route or a rejected query will not change on a retry.
  for (let attempt = 1; attempt <= PRICE_INSIGHT_ATTEMPTS; attempt += 1) {
    try {
      const response = await axiosInstance.get("/public/v1/price-insight", {
        params,
        timeout: PRICE_INSIGHT_TIMEOUT_MS,
      });
      if (response.data?.status === false) return null;
      return toPriceInsightView(response.data?.data, catalogPlaceAr);
    } catch (error) {
      const status = error?.response?.status;
      console.warn(
        "[lenaqar] price insight unavailable",
        status || error?.code || error?.message,
        `attempt ${attempt}/${PRICE_INSIGHT_ATTEMPTS}`,
      );
      if (status && status < 500) return null;
    }
  }
  return null;
}
