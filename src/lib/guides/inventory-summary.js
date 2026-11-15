/**
 * LenAqar's own asking-price summary for an area price guide.
 *
 * ONE defined sample feeds every number on the section: the apartment listings
 * of that place currently shown on lenaqar.com (the public catalog, resale),
 * deduplicated by listing code, with a usable price and area and a plausible
 * price per m². The row counts, medians, ranges and the "last updated" date
 * range are all computed from that same sample, so the section never describes
 * one set of units with statistics from another (a review on PR #47 found the
 * earlier version mixed backend price-insight counts with catalog dates).
 *
 * Price = the listing's total asking price (what the listing card shows);
 * price per m² = total price ÷ area, as on the cards (metrics.pricePerMeter).
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

const PLAUSIBLE_PER_SQM = [5_000, 1_000_000];
const TRIM_FROM = 20;
const TRIM_SHARE = 0.05;

function inPlace(unit, config) {
  return (config.level || "district") === "district"
    ? token(unit?.district) === config.district && token(unit?.city) === config.city
    : token(unit?.city) === config.city;
}

/**
 * The defined sample: listings shown on lenaqar.com for this place and property
 * type, resale only, one per listing code, with a total price, an area and a
 * plausible price per m². Each entry keeps what the table and dates need.
 */
export function definedSample(units, config) {
  const seen = new Set();
  const sample = [];
  for (const unit of Array.isArray(units) ? units : []) {
    if (!unit || !inPlace(unit, config)) continue;
    if (token(unit.buildingType) !== config.propertyType) continue;
    if (unit.isPrimary === true) continue;
    const code = String(unit.code || "");
    if (!code || seen.has(code)) continue;
    const price = positive(unit.totalPrice);
    const area = positive(unit.landArea);
    if (price == null || area == null) continue;
    const perSqm = price / area;
    if (perSqm < PLAUSIBLE_PER_SQM[0] || perSqm > PLAUSIBLE_PER_SQM[1]) continue;
    seen.add(code);
    const day = typeof unit.updatedAt === "string" ? unit.updatedAt.slice(0, 10) : "";
    sample.push({
      code,
      price,
      perSqm,
      bedrooms: positive(unit.roomsCount),
      updated: /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null,
    });
  }
  return sample;
}

function median(sorted) {
  const n = sorted.length;
  if (!n) return null;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/** One table row from the sample, or null below the minimum sample. */
export function summarizeSegment(sample, segment, { minSample = MIN_SEGMENT_SAMPLE } = {}) {
  const want = segment?.bedrooms ?? null;
  const rows = want == null ? sample : sample.filter((u) => u.bedrooms === want);
  if (rows.length < minSample) return null;
  const prices = rows.map((u) => u.price).sort((a, b) => a - b);
  const perSqm = rows.map((u) => u.perSqm).sort((a, b) => a - b);
  const cut = rows.length >= TRIM_FROM ? Math.floor(rows.length * TRIM_SHARE) : 0;
  const inRange = prices.slice(cut, prices.length - cut);
  return {
    labelAr: segment.labelAr,
    bedrooms: want,
    count: rows.length,
    perMeter: Math.round(median(perSqm)),
    unitPrice: Math.round(median(prices)),
    lowest: Math.round(inRange[0]),
    highest: Math.round(inRange[inRange.length - 1]),
  };
}

/** Earliest and latest "last updated" dates within the sample. */
export function recordDateRange(sample) {
  const dates = sample.map((u) => u.updated).filter(Boolean).sort();
  if (!dates.length) return null;
  return { earliest: dates[0], latest: dates[dates.length - 1], dated: dates.length };
}

/**
 * The whole summary, or null when the all-units row is missing (sub-categories
 * without the headline figure would mislead) or no listing in the sample has a
 * date. `asOf` is the observation date (YYYY-MM-DD) the page computed it.
 */
export function buildInventorySummary(config, units, { asOf = "" } = {}) {
  if (!config) return null;
  const sample = definedSample(units, config);
  const rows = config.segments.map((segment) => summarizeSegment(sample, segment)).filter(Boolean);
  if (!rows.length || rows[0].bedrooms !== null) return null;
  const records = recordDateRange(sample);
  if (!records) return null;
  return {
    placeAr: config.placeAr,
    listingsHref: config.listingsHref,
    asOf,
    sampleSize: sample.length,
    rows,
    records,
  };
}
