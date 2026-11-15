import { fetchOpportunityCatalog } from "@/lib/lenaqar/opportunities.server";
import { buildInventorySummary, inventoryConfigForGuide } from "./inventory-summary.js";

/** Today's date in Cairo as YYYY-MM-DD (the observation date of the table). */
function cairoToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
}

/**
 * LenAqar asking-price summary for a guide page, or null.
 *
 * Reads only the public catalog (the listings shown on lenaqar.com), so every
 * number on the section comes from one sample. Never throws: no config, a
 * failing backend or an incomplete catalog render the guide without it. The
 * catalog call is cookie-free and cached, so the page stays static/ISR.
 */
export async function loadGuideInventorySummary(slug) {
  const config = inventoryConfigForGuide(slug);
  if (!config) return null;
  try {
    const units = await fetchOpportunityCatalog(
      config.level === "city" ? { city: config.city } : { city: config.city, district: config.district },
    );
    return buildInventorySummary(config, units, { asOf: cairoToday() });
  } catch (error) {
    console.warn("[guides] inventory summary unavailable", slug, error?.message);
    return null;
  }
}
