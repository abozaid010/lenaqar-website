import { cache } from "react";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { SITE } from "@/config/site";
import { mapSlimUnitToListItem } from "@/lib/units/slim-unit-list-mapper";
import { getPublicUnitByCode } from "@/lib/units/unit-api";
import { toPublicOpportunity } from "./to-public-opportunity";
import { isListableOpportunity, validateUnit } from "./validate-unit";

const BFF_SECRET = process.env.BFF_SECRET ?? "";

function yearFromDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

function pickSearchString(params, key) {
  const value = params?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function pickPositiveNumber(params, key) {
  const n = Number(pickSearchString(params, key));
  return Number.isFinite(n) && n > 0 ? n : "";
}

/**
 * URL query → listing filters.
 * city / district / bedrooms / min_price / max_price are the same keys
 * `requirementToUnitsFilter` sends to slim-list / public units.
 */
export function parseOpportunitySearchParams(params = {}) {
  return {
    area: pickSearchString(params, "area"),
    maxCash: pickSearchString(params, "cash"),
    deliveryYear: pickSearchString(params, "delivery"),
    city: pickSearchString(params, "city"),
    district: pickSearchString(params, "district"),
    subDistrict: pickSearchString(params, "sub_district"),
    project:
      pickSearchString(params, "project") ||
      pickSearchString(params, "project_name"),
    bedrooms: pickPositiveNumber(params, "bedrooms"),
    minPrice: pickPositiveNumber(params, "min_price"),
    maxPrice: pickPositiveNumber(params, "max_price"),
    propertyType: pickSearchString(params, "property_type"),
  };
}

async function fetchPage(query, { required = false } = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
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
    if (required) {
      throw new Error("OPPORTUNITIES_FETCH_FAILED");
    }
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

async function fetchBoundedPages({
  city,
  district,
  subDistrict,
  project,
  minPrice,
  maxPrice,
  bedrooms,
} = {}) {
  const collected = [];
  let cursor = null;

  for (let page = 0; page < SITE.feed.maxPages; page += 1) {
    const query = {
      client_id: SITE.clientId,
      purpose: SITE.inventory.purpose,
      page_size: SITE.feed.pageSize,
      city,
      district,
      sub_district: subDistrict,
      project_name: project,
      min_price: minPrice,
      max_price: maxPrice,
      bedrooms,
      cursor,
    };
    if (
      SITE.inventory.isPrimary === true ||
      SITE.inventory.isPrimary === false
    ) {
      query.is_primary = SITE.inventory.isPrimary;
    }

    const { units, pagination } = await fetchPage(query, {
      required: page === 0,
    });
    collected.push(...units);

    if (!pagination?.has_more_next || !pagination?.next_cursor) break;
    cursor = pagination.next_cursor;
  }

  return collected;
}

function matchesExact(value, needle) {
  if (!needle) return true;
  const want = String(needle).trim().toLowerCase();
  if (!want) return true;
  return String(value || "").trim().toLowerCase() === want;
}

function matchesArea(unit, area) {
  if (!area) return true;
  const needle = String(area).trim().toLowerCase();
  if (!needle) return true;
  return [unit.city, unit.district, unit.subDistrict].some(
    (value) => String(value || "").trim().toLowerCase() === needle
  );
}

function matchesProject(unit, project) {
  if (!project) return true;
  const needle = String(project).trim().toLowerCase();
  if (!needle) return true;
  return [unit.project, unit.projectAr].some(
    (value) => String(value || "").trim().toLowerCase() === needle
  );
}

function matchesMaxCash(unit, maxCash) {
  if (maxCash == null || maxCash === "") return true;
  const cap = Number(maxCash);
  if (!Number.isFinite(cap) || cap <= 0) return true;
  const cash = Number(unit.downPayment);
  if (!Number.isFinite(cash) || cash <= 0) return false;
  return cash <= cap;
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

function matchesPropertyType(unit, propertyType) {
  if (!propertyType) return true;
  const needle = String(propertyType).trim().toLowerCase();
  if (!needle) return true;
  return String(unit.buildingType || "").trim().toLowerCase() === needle;
}

export function applyInProcessFilters(
  units,
  {
    area,
    city,
    district,
    subDistrict,
    project,
    maxCash,
    deliveryYear,
    propertyType,
  } = {}
) {
  return units.filter(
    (unit) =>
      matchesArea(unit, area) &&
      matchesExact(unit.city, city) &&
      matchesExact(unit.district, district) &&
      matchesExact(unit.subDistrict, subDistrict) &&
      matchesProject(unit, project) &&
      matchesMaxCash(unit, maxCash) &&
      matchesDeliveryYear(unit, deliveryYear) &&
      matchesPropertyType(unit, propertyType)
  );
}

function toFeedItem(raw) {
  const unit = toPublicOpportunity(mapSlimUnitToListItem(raw));
  if (!unit) return null;
  if (!isListableOpportunity(unit)) return null;

  const gate = validateUnit(unit);
  return {
    ...unit,
    cashMultiple: gate.ok ? gate.cashMultiple : null,
  };
}

function sortFeed(units) {
  return [...units].sort((a, b) => (b.cashMultiple ?? 0) - (a.cashMultiple ?? 0));
}

const loadCatalog = cache(async (apiKey) => {
  const api = JSON.parse(apiKey);
  const raw = await fetchBoundedPages(api);
  const seen = new Set();
  const validated = [];

  for (const row of raw) {
    const item = toFeedItem(row);
    if (!item || seen.has(item.code)) continue;
    seen.add(item.code);
    validated.push(item);
  }

  return sortFeed(validated).slice(0, SITE.feed.maxUnits);
});

function catalogApiKey({
  city,
  district,
  subDistrict,
  project,
  minPrice,
  maxPrice,
  bedrooms,
} = {}) {
  return JSON.stringify({
    city: city || "",
    district: district || "",
    subDistrict: subDistrict || "",
    project: project || "",
    minPrice: minPrice || "",
    maxPrice: maxPrice || "",
    bedrooms: bedrooms || "",
  });
}

/**
 * Cursor-paginated public listing, mapped through the slim list shape
 * then the privacy allowlist. Never forwards the raw unit document.
 */
export async function fetchOpportunityCatalog(apiFilters = {}) {
  return loadCatalog(catalogApiKey(apiFilters));
}

/**
 * Cursor-paginated fetch, bounded by SITE.feed.maxPages.
 * Honoured API params first, then in-process area/cash/delivery/type.
 */
export async function fetchOpportunities({
  city,
  district,
  subDistrict,
  project,
  minPrice,
  maxPrice,
  bedrooms,
  area,
  maxCash,
  deliveryYear,
  propertyType,
} = {}) {
  const catalog = await fetchOpportunityCatalog({
    city,
    district,
    subDistrict,
    project,
    minPrice,
    maxPrice,
    bedrooms,
  });
  return applyInProcessFilters(catalog, {
    area,
    city,
    district,
    subDistrict,
    project,
    maxCash,
    deliveryYear,
    propertyType,
  });
}

export async function fetchOpportunityByCode(code) {
  const needle = String(code || "").trim();
  if (!needle) return null;

  try {
    const response = await getPublicUnitByCode(needle);
    const raw = response?.data?.units?.[0];
    const item = raw ? toFeedItem(raw) : null;
    if (item) return item;
  } catch (error) {
    console.error(
      "[lenaqar] unit-by-code failed",
      error instanceof Error ? error.message : error
    );
  }

  const units = await fetchOpportunities();
  return units.find((unit) => unit.code === needle) ?? null;
}
