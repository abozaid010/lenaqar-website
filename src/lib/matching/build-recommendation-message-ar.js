import {
  buildCanonicalUnitShareUrl,
  resolveUnitCodeFromListItem,
} from "@/lib/units/unit-share-links";
import {
  isRentPurpose,
  resolveUnitDisplayPrice,
} from "@/lib/units/unit-price";
import { formatPrice } from "@/utils/parse-amount";
import { getMatchingUnitId } from "@/lib/matching/unit-recommendation-service";

function toPositiveNumber(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Prefer project, then sub-district (slim list may only have district). */
function resolveLocationLabel(unit) {
  const project = String(unit?.project || "").trim();
  if (project) return project;
  return String(
    unit?.sub_district || unit?.subDistrict || unit?.district || "",
  ).trim();
}

function resolveRoomsLabel(unit) {
  const raw = unit?.roomsCount ?? unit?.bedrooms;
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(n)) return `${n} غرف`;
  const text = String(raw).trim();
  return text ? `${text} غرف` : null;
}

function resolveAreaLabel(unit) {
  const area =
    toPositiveNumber(unit?.landArea) ?? toPositiveNumber(unit?.area);
  if (area == null) return null;
  return `${area} م²`;
}

function resolvePriceLabel(unit) {
  const price = resolveUnitDisplayPrice(unit);
  const formatted = price != null ? formatPrice(price) : null;
  if (!formatted) return null;
  if (isRentPurpose(unit?.purpose)) {
    return `إيجار شهري ${formatted} ج.م`;
  }
  return `السعر ${formatted} ج.م`;
}

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
    const location = resolveLocationLabel(unit);
    const roomsLabel = resolveRoomsLabel(unit);
    const areaLabel = resolveAreaLabel(unit);
    const priceLabel = resolvePriceLabel(unit);
    const listingClientId =
      (unit?.clientId != null && String(unit.clientId).trim()) ||
      (unit?.client_id != null && String(unit.client_id).trim()) ||
      clientId ||
      null;
    const link = code
      ? buildCanonicalUnitShareUrl(code, listingClientId)
      : "";

    const details = [location, roomsLabel, areaLabel, priceLabel].filter(
      Boolean,
    );
    lines.push(
      details.length > 0
        ? `${index + 1}) ${details.join(" — ")}`
        : `${index + 1})`,
    );
    if (link) lines.push(link);
    lines.push("");
  });

  lines.push(
    "لو حابب تشوف خيارات إضافية أو تحدد ميعاد معاينة، تواصل معنا في أي وقت.",
  );

  return lines.join("\n").trim();
}
