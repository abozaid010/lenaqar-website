import axiosInstance from "@/utils/axiosInstance";
import { catalogPlaceAr } from "@/lib/lenaqar/arabic-labels.server";
import { priceInsightQuery, toPriceInsightView } from "@/lib/lenaqar/price-insight";

// The success screen is already on screen while this loads; a slow answer is dropped.
const PRICE_INSIGHT_TIMEOUT_MS = 8000;

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
  try {
    const response = await axiosInstance.get("/public/v1/price-insight", {
      params,
      timeout: PRICE_INSIGHT_TIMEOUT_MS,
    });
    if (response.data?.status === false) return null;
    return toPriceInsightView(response.data?.data, catalogPlaceAr);
  } catch (error) {
    console.warn(
      "[lenaqar] price insight unavailable",
      error?.response?.status || error?.code || error?.message,
    );
    return null;
  }
}
