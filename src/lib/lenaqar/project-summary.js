/**
 * Public project pages: the allowlisted project record and the unit-price
 * summary shown on it.
 *
 * Privacy rule: nothing here keeps a unit id, unit code, author, client,
 * owner, note or contact. A project page only ever sees aggregates (counts,
 * minimum, median, maximum) computed from developer units, and only for
 * groups large enough that no single unit can be read back out of them.
 *
 * Prices are developer list prices as recorded in the catalogue on the dates
 * given. They are never described as verified or as completed-sale prices.
 */

import { formatEgpNumber } from "./metrics.js";

/** A project gets a page only with at least this many usable units. */
export const MIN_PROJECT_UNITS = 10;

/** A type or type-and-rooms row is shown only with at least this many units. */
export const MIN_GROUP_UNITS = 5;

/** Same plausibility band as the area price guides (EGP per m²). */
const PLAUSIBLE_PER_SQM = [5_000, 1_000_000];

const DELIVERY_YEARS = [2015, 2050];

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function token(value) {
  return text(value).toLowerCase();
}

function textList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(token).filter(Boolean))];
}

/** Latin, lower-case, hyphenated slug of a project's English name. */
export function projectSlug(nameEn) {
  return token(nameEn)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function median(sorted) {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function isoDate(value, now) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() > now.getTime()) return null;
  return date.toISOString().slice(0, 10);
}

function deliveryYear(unit) {
  const fromDate = unit?.deliveryDate ? new Date(unit.deliveryDate).getFullYear() : NaN;
  const year = Number.isFinite(fromDate) ? fromDate : Number(unit?.deliveryYear);
  return Number.isInteger(year) && year >= DELIVERY_YEARS[0] && year <= DELIVERY_YEARS[1]
    ? year
    : null;
}

/**
 * The only unit fields the summary reads. Anything else on the API row is
 * dropped here, before aggregation.
 */
export function toSummaryUnit(row, now = new Date()) {
  const price = positive(row?.totalPrice);
  const area = positive(row?.landArea);
  if (price == null || area == null) return null;
  const perMeter = price / area;
  if (perMeter < PLAUSIBLE_PER_SQM[0] || perMeter > PLAUSIBLE_PER_SQM[1]) return null;
  const downPayment = positive(row?.downPayment);
  return {
    type: token(row?.buildingType) || null,
    rooms: Number.isInteger(Number(row?.roomsCount)) && Number(row.roomsCount) > 0
      ? Number(row.roomsCount)
      : null,
    price,
    area,
    perMeter,
    downPayment: downPayment != null && downPayment < price ? downPayment : null,
    deliveryYear: deliveryYear(row),
    updated: isoDate(row?.updatedAt, now),
  };
}

function stats(units) {
  const prices = units.map((u) => u.price).sort((a, b) => a - b);
  const perMeter = units.map((u) => u.perMeter).sort((a, b) => a - b);
  const areas = units.map((u) => u.area).sort((a, b) => a - b);
  return {
    units: units.length,
    priceMin: Math.round(prices[0]),
    priceMedian: Math.round(median(prices)),
    priceMax: Math.round(prices[prices.length - 1]),
    perMeterMedian: Math.round(median(perMeter)),
    areaMin: Math.round(areas[0]),
    areaMax: Math.round(areas[areas.length - 1]),
  };
}

function groupBy(units, keyOf) {
  const groups = new Map();
  for (const unit of units) {
    const key = keyOf(unit);
    if (key == null) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(unit);
  }
  return groups;
}

/**
 * Aggregate one project's usable units (already passed through toSummaryUnit).
 * Returns null below MIN_PROJECT_UNITS.
 */
export function summarizeProjectUnits(units) {
  const usable = (units || []).filter(Boolean);
  if (usable.length < MIN_PROJECT_UNITS) return null;

  const byType = [...groupBy(usable, (u) => u.type)]
    .filter(([, group]) => group.length >= MIN_GROUP_UNITS)
    .map(([type, group]) => ({ type, ...stats(group) }))
    .sort((a, b) => b.units - a.units);

  const byRooms = [...groupBy(usable, (u) => (u.type && u.rooms ? `${u.type}|${u.rooms}` : null))]
    .filter(([, group]) => group.length >= MIN_GROUP_UNITS)
    .map(([key, group]) => {
      const [type, rooms] = key.split("|");
      return { type, rooms: Number(rooms), ...stats(group) };
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.rooms - b.rooms);

  const years = usable.map((u) => u.deliveryYear).filter((y) => y != null).sort((a, b) => a - b);
  const downPayments = usable.map((u) => u.downPayment).filter((v) => v != null).sort((a, b) => a - b);
  const dates = usable.map((u) => u.updated).filter(Boolean).sort();

  return {
    ...stats(usable),
    byType,
    byRooms,
    deliveryYearMin: years.length ? years[0] : null,
    deliveryYearMax: years.length ? years[years.length - 1] : null,
    // A minimum over fewer units than a shown group would point at one unit.
    downPaymentMin: downPayments.length >= MIN_GROUP_UNITS ? Math.round(downPayments[0]) : null,
    downPaymentMedian: downPayments.length >= MIN_GROUP_UNITS ? Math.round(median(downPayments)) : null,
    updatedFrom: dates.length ? dates[0] : null,
    updatedTo: dates.length ? dates[dates.length - 1] : null,
  };
}

/**
 * Allowlisted project facts. Free-text description, images, map links,
 * coordinates, payment-plan text, author and client are deliberately left out.
 */
export function toPublicProject(row) {
  const nameEn = text(row?.en_name);
  const slug = projectSlug(nameEn);
  if (!slug) return null;
  return {
    slug,
    nameEn,
    nameAr: text(row?.ar_name) || null,
    developer: text(row?.developer_name) || null,
    city: token(row?.city) || null,
    district: token(row?.district) || null,
    subDistrict: token(row?.sub_district) || null,
    finishing: textList(row?.finishing_type),
    propertyTypes: textList(row?.properties_types),
    soldOut: row?.primary_units_sold_out === true,
  };
}

/** Every key a snapshot project may carry; the privacy test checks against it. */
export const PUBLIC_PROJECT_KEYS = [
  "slug",
  "nameEn",
  "nameAr",
  "developer",
  "city",
  "district",
  "subDistrict",
  "finishing",
  "propertyTypes",
  "soldOut",
  "summary",
];

/**
 * WebPage JSON-LD for a project page. Every value is also visible on the
 * page: the price range and unit count, and `dateModified` = the newest change
 * among the unit records the summary was computed from.
 */
export function buildProjectSchema({ project, labels, url, title, description }) {
  const summary = project?.summary;
  if (!summary) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url,
    name: title,
    description,
    inLanguage: "ar-EG",
    ...(summary.updatedTo && { dateModified: summary.updatedTo }),
    about: {
      "@type": "Place",
      name: labels?.name || project.nameEn,
      ...((labels?.city || labels?.district) && {
        address: {
          "@type": "PostalAddress",
          ...(labels.district && { addressLocality: labels.district }),
          ...(labels.city && { addressRegion: labels.city }),
          addressCountry: "EG",
        },
      }),
    },
    mainEntity: {
      "@type": "AggregateOffer",
      priceCurrency: "EGP",
      lowPrice: summary.priceMin,
      highPrice: summary.priceMax,
      offerCount: summary.units,
    },
  };
}

/** Longest page title before the site brand is appended by the root template. */
const TITLE_MAX = 58;

/**
 * Title and description, built only from the snapshot's own numbers. The
 * developer name is dropped from the title when it would run too long.
 */
export function projectMetaText(project, labels) {
  const { summary } = project;
  const place = [labels.district, labels.city].filter(Boolean).join("، ");
  const withDeveloper = `أسعار ${labels.name}${labels.developer ? ` — ${labels.developer}` : ""}`;
  const title = withDeveloper.length <= TITLE_MAX ? withDeveloper : `أسعار ${labels.name}`;
  const description =
    `ملخص أسعار ${summary.units} وحدة من المطور في ${labels.name}` +
    `${place ? ` (${place})` : ""}: من ${formatEgpNumber(summary.priceMin)} إلى ` +
    `${formatEgpNumber(summary.priceMax)} ج.م، ووسيط سعر المتر ` +
    `${formatEgpNumber(summary.perMeterMedian)} ج.م. أسعار قوائم المطور بتاريخها، مش أسعار بيع نهائية.`;
  return { title, description };
}
