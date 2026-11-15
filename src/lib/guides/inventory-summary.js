/**
 * LenAqar's own asking-price summary for an area price guide.
 *
 * The figures come from the backend's `GET /public/v1/price-insight` (the same
 * route the buy-request success card uses): medians over listed resale units at
 * their cash value, developer units left out, impossible prices dropped, and the
 * cheapest / dearest 5% left out of the range from 20 units up.
 *
 * The backend widens the scope when too few units match (drops bedrooms, then the
 * district, then the city) and says so in `relaxed` / `scope`. A guide row must
 * describe exactly the place and category it is labelled with, so any widened or
 * thin answer is dropped here instead of printed under the wrong label.
 */

/** A category with fewer listed units than this is not shown. */
export const MIN_SEGMENT_SAMPLE = 20;

/** Guides that show a summary, keyed by canonical guide path. */
export const GUIDE_INVENTORY = {
  "/guides/madinaty/prices-2026": {
    level: "district",
    city: "new cairo",
    district: "madinaty",
    propertyType: "apartment",
    placeAr: "مدينتي",
    listingsHref: "/apartments-for-sale/madinaty",
    segments: [
      { bedrooms: null, labelAr: "كل الشقق" },
      { bedrooms: 2, labelAr: "شقق غرفتين" },
      { bedrooms: 3, labelAr: "شقق 3 غرف" },
    ],
  },
  "/guides/fifth-settlement/prices-2026": {
    level: "district",
    city: "new cairo",
    district: "fifth settlement",
    propertyType: "apartment",
    placeAr: "التجمع الخامس",
    listingsHref: "/apartments-for-sale/fifth-settlement",
    segments: [
      { bedrooms: null, labelAr: "كل الشقق" },
      { bedrooms: 2, labelAr: "شقق غرفتين" },
      { bedrooms: 3, labelAr: "شقق 3 غرف" },
    ],
  },
  "/guides/new-cairo/prices-2026": {
    level: "city",
    city: "new cairo",
    district: null,
    propertyType: "apartment",
    placeAr: "القاهرة الجديدة (كل الأحياء)",
    listingsHref: "/apartments-for-sale/new-cairo",
    segments: [
      { bedrooms: null, labelAr: "كل الشقق" },
      { bedrooms: 2, labelAr: "شقق غرفتين" },
      { bedrooms: 3, labelAr: "شقق 3 غرف" },
    ],
  },
  "/guides/el-shorouk/prices-2026": {
    level: "district",
    city: "cairo",
    district: "el shorouk city",
    propertyType: "apartment",
    placeAr: "الشروق",
    listingsHref: "/apartments-for-sale/el-shorouk",
    segments: [
      { bedrooms: null, labelAr: "كل الشقق" },
      { bedrooms: 2, labelAr: "شقق غرفتين" },
      { bedrooms: 3, labelAr: "شقق 3 غرف" },
    ],
  },
};

function canonicalPath(slug) {
  const path = String(slug || "").trim().replace(/\/+$/, "");
  return path.startsWith("/") ? path : `/${path}`;
}

function positive(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function token(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Summary config for a guide slug, or null. */
export function inventoryConfigForGuide(slug) {
  return GUIDE_INVENTORY[canonicalPath(slug)] || null;
}

/** Query string fields for one segment. */
export function priceInsightParams(config, segment) {
  const params = { city: config.city };
  if (config.level === "district") params.district = config.district;
  params.property_type = config.propertyType;
  if (segment?.bedrooms != null) params.bedrooms = segment.bedrooms;
  return params;
}

/**
 * One table row, or null when the answer does not describe exactly this place and
 * category with enough units.
 */
export function toSummaryRow(data, config, segment, { minSample = MIN_SEGMENT_SAMPLE } = {}) {
  if (!data || typeof data !== "object" || data.available !== true) return null;
  if (!Array.isArray(data.relaxed) || data.relaxed.length > 0) return null;

  const scope = data.scope && typeof data.scope === "object" ? data.scope : {};
  const level = config.level || "district";
  if (token(scope.level) !== level) return null;
  if (token(scope.city) !== config.city) return null;
  if (level === "district" && token(scope.district) !== config.district) return null;
  if (token(scope.property_type) !== config.propertyType) return null;
  const wantBedrooms = segment?.bedrooms ?? null;
  const gotBedrooms = scope.bedrooms == null ? null : Number(scope.bedrooms);
  if (gotBedrooms !== wantBedrooms) return null;

  const count = positive(data.sample_size);
  const perMeter = positive(data.median_price_per_sqm);
  const unitPrice = positive(data.median_unit_price);
  const lowest = positive(data.lowest_unit_price);
  const highest = positive(data.highest_unit_price);
  if (count == null || count < minSample) return null;
  if (perMeter == null || unitPrice == null || lowest == null || highest == null) return null;

  return {
    labelAr: segment.labelAr,
    bedrooms: wantBedrooms,
    count: Math.round(count),
    perMeter: Math.round(perMeter),
    unitPrice: Math.round(unitPrice),
    lowest: Math.round(lowest),
    highest: Math.round(highest),
    asOf: typeof data.as_of === "string" ? data.as_of.slice(0, 10) : "",
  };
}

/**
 * Earliest and latest "last updated" dates of the listed units the summary
 * covers. Shown so a reader can judge freshness; it never marks a price verified.
 */
export function recordDateRange(units, config) {
  const dates = [];
  for (const unit of Array.isArray(units) ? units : []) {
    if ((config.level || "district") === "district"
      ? token(unit?.district) !== config.district
      : token(unit?.city) !== config.city) continue;
    if (token(unit?.buildingType) !== config.propertyType) continue;
    const day = typeof unit?.updatedAt === "string" ? unit.updatedAt.slice(0, 10) : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) dates.push(day);
  }
  if (!dates.length) return null;
  dates.sort();
  return { earliest: dates[0], latest: dates[dates.length - 1] };
}

/**
 * The whole summary, or null when the all-units row is missing (a table of
 * sub-categories without the headline figure would be misleading) or the record
 * dates are unknown.
 */
export function buildInventorySummary(config, answers, units) {
  if (!config) return null;
  const rows = config.segments
    .map((segment, i) => toSummaryRow(answers?.[i], config, segment))
    .filter(Boolean);
  if (!rows.length || rows[0].bedrooms !== null) return null;
  const records = recordDateRange(units, config);
  if (!records) return null;
  return {
    placeAr: config.placeAr,
    listingsHref: config.listingsHref,
    asOf: rows[0].asOf,
    rows,
    records,
  };
}
