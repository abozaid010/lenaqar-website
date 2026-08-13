import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { SITE } from "@/config/site";
import { toPublicOpportunity } from "./to-public-opportunity";
import { validateUnit } from "./validate-unit";
import { matchesNetwork } from "./network-filter";
import { cashMultiple } from "./metrics";

const BFF_SECRET = process.env.BFF_SECRET ?? "";

function yearFromDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

async function fetchPage(params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    qs.set(key, String(value));
  }

  const headers = { accept: "application/json" };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;
  if (BFF_SECRET) headers["X-BFF-Secret"] = BFF_SECRET;

  const response = await fetch(`${API_BASE_URL}/public/v1/units?${qs}`, {
    headers,
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    console.error("[lenaqar] units fetch failed", response.status);
    return { units: [], pagination: {} };
  }

  const json = await response.json();
  const units = json?.data?.units ?? json?.units ?? [];
  const pagination = json?.data?.pagination ?? json?.pagination ?? {};
  return {
    units: Array.isArray(units) ? units : [],
    pagination,
  };
}

async function fetchBoundedPages({ city, district, minPrice, maxPrice } = {}) {
  const collected = [];
  let cursor = null;

  for (let page = 0; page < SITE.feed.maxPages; page += 1) {
    const params = {
      client_id: SITE.clientId,
      purpose: SITE.inventory.purpose,
      page_size: SITE.feed.pageSize,
      city,
      district,
      min_price: minPrice,
      max_price: maxPrice,
      cursor,
    };
    if (SITE.inventory.isPrimary === true || SITE.inventory.isPrimary === false) {
      params.is_primary = SITE.inventory.isPrimary;
    }

    const { units, pagination } = await fetchPage(params);
    collected.push(...units);

    if (!pagination?.has_more_next || !pagination?.next_cursor) break;
    cursor = pagination.next_cursor;
  }

  return collected;
}

function matchesArea(unit, area) {
  if (!area) return true;
  const needle = String(area).trim().toLowerCase();
  if (!needle) return true;
  return [unit.city, unit.district, unit.subDistrict].some(
    (value) => String(value || "").trim().toLowerCase() === needle
  );
}

function matchesMaxCash(unit, maxCash) {
  if (maxCash == null || maxCash === "") return true;
  const cap = Number(maxCash);
  if (!Number.isFinite(cap) || cap <= 0) return true;
  return Number(unit.downPayment) <= cap;
}

function matchesDeliveryYear(unit, deliveryYear) {
  if (deliveryYear == null || deliveryYear === "") return true;
  const year = Number(deliveryYear);
  if (!Number.isFinite(year)) return true;
  const unitYear =
    Number(unit.deliveryYear) || yearFromDate(unit.deliveryDate);
  if (!unitYear) return false;
  return unitYear === year;
}

function applyInProcessFilters(units, { area, maxCash, deliveryYear } = {}) {
  return units.filter(
    (unit) =>
      matchesArea(unit, area) &&
      matchesMaxCash(unit, maxCash) &&
      matchesDeliveryYear(unit, deliveryYear)
  );
}

function toFeedItem(raw) {
  const unit = toPublicOpportunity(raw);
  if (!unit) return null;

  const gate = validateUnit(unit);
  if (!gate.ok) {
    console.warn("[lenaqar] unit excluded", gate.code, gate.reason);
    return null;
  }
  if (!matchesNetwork(unit, SITE.network)) return null;

  return {
    ...unit,
    cashMultiple: cashMultiple(unit.totalPrice, unit.downPayment),
  };
}

/**
 * Cursor-paginated fetch, bounded by SITE.feed.maxPages.
 * Honoured API params only, then in-process allowlist → validate → network
 * → cash/delivery filter → sort by cash multiple → cap at maxUnits.
 */
export async function fetchOpportunities({
  city,
  district,
  minPrice,
  maxPrice,
  area,
  maxCash,
  deliveryYear,
} = {}) {
  const raw = await fetchBoundedPages({ city, district, minPrice, maxPrice });
  const seen = new Set();
  const validated = [];

  for (const row of raw) {
    const item = toFeedItem(row);
    if (!item || seen.has(item.code)) continue;
    seen.add(item.code);
    validated.push(item);
  }

  validated.sort((a, b) => (b.cashMultiple ?? 0) - (a.cashMultiple ?? 0));
  const capped = validated.slice(0, SITE.feed.maxUnits);
  return applyInProcessFilters(capped, { area, maxCash, deliveryYear });
}

export async function fetchOpportunityByCode(code) {
  const needle = String(code || "").trim();
  if (!needle) return null;
  const units = await fetchOpportunities();
  return units.find((unit) => unit.code === needle) ?? null;
}
