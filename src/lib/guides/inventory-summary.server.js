import {
  fetchOpportunityCatalog,
  publicApiGet,
} from "@/lib/lenaqar/opportunities.server";
import {
  buildInventorySummary,
  inventoryConfigForGuide,
  priceInsightParams,
} from "./inventory-summary.js";

/**
 * LenAqar asking-price summary for a guide page, or null.
 *
 * Never throws: a guide without a summary config, a failing backend or an
 * incomplete catalog all render the guide without the section. Both calls are
 * cookie-free and cached (`revalidate: 900`), so the page stays static/ISR.
 */
export async function loadGuideInventorySummary(slug) {
  const config = inventoryConfigForGuide(slug);
  if (!config) return null;
  try {
    const [answers, units] = await Promise.all([
      Promise.all(
        config.segments.map(async (segment) => {
          const qs = new URLSearchParams(priceInsightParams(config, segment));
          const json = await publicApiGet(`/public/v1/price-insight?${qs}`);
          return json?.status === false ? null : json?.data ?? null;
        }),
      ),
      fetchOpportunityCatalog(config.level === "city" ? { city: config.city } : { city: config.city, district: config.district }),
    ]);
    return buildInventorySummary(config, answers, units);
  } catch (error) {
    console.warn("[guides] inventory summary unavailable", slug, error?.message);
    return null;
  }
}
