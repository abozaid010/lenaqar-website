import {
  buildCanonicalUnitShareUrl,
  resolveUnitCodeFromListItem,
} from "@/lib/units/unit-share-links";
import { resolveUnitDisplayPrice } from "@/lib/units/unit-price";
import { formatPrice } from "@/utils/parse-amount";
import { getMatchingUnitId } from "@/lib/matching/unit-recommendation-service";

/**
 * Build default Arabic WhatsApp recommendation message for a lead.
 * @param {{
 *   leadName?: string,
 *   units: Array,
 *   clientId?: string | null,
 * }} opts
 * @returns {string}
 */
export function buildRecommendationMessageAr({
  leadName = "",
  units = [],
  clientId = null,
} = {}) {
  const name = String(leadName || "").trim() || "حضرتك";
  const list = Array.isArray(units) ? units : [];

  const lines = [
    `السلام عليكم ${name}،`,
    "",
    "اخترنا لك عدة وحدات مناسبة بناءً على متطلباتك:",
    "",
  ];

  list.forEach((unit, index) => {
    const code = resolveUnitCodeFromListItem(unit) || getMatchingUnitId(unit) || "";
    const project = String(unit?.project || "").trim();
    const price = resolveUnitDisplayPrice(unit);
    const priceLabel = price != null && formatPrice(price) ? formatPrice(price) : null;
    const listingClientId =
      (unit?.clientId != null && String(unit.clientId).trim()) ||
      (unit?.client_id != null && String(unit.client_id).trim()) ||
      clientId ||
      null;
    const link = code
      ? buildCanonicalUnitShareUrl(code, listingClientId)
      : "";

    const parts = [`${index + 1})`];
    if (code) parts.push(`كود ${code}`);
    if (project) parts.push(`— ${project}`);
    if (priceLabel) parts.push(`— ${priceLabel} ج.م`);
    lines.push(parts.join(" "));
    if (link) lines.push(link);
    lines.push("");
  });

  lines.push(
    "لو حابب تشوف خيارات إضافية أو تحدد ميعاد معاينة، تواصل معنا في أي وقت.",
  );

  return lines.join("\n").trim();
}
