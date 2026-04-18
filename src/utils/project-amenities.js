import {
  AMENITY_VALUE_ALIASES,
  DEFAULT_PROJECT_AMENITIES,
  PROJECT_AMENITY_LABELS,
} from "@/constants/project-amenities";

/**
 * Single amenity key: trim + lowercase (API / form contract).
 */
export function normalizeAmenityKey(input) {
  let s = String(input ?? "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/['’]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Map legacy / alternate spellings to canonical enum `value`.
 */
export function resolveCanonicalAmenityValue(key) {
  if (!key) return "";
  return AMENITY_VALUE_ALIASES[key] || key;
}

/**
 * Ensures a clean `string[]` for create/edit/API (no objects, deduped, canonical values).
 * Accepts `string[]` or legacy comma-separated `string`.
 */
export function normalizeAmenitiesArray(input) {
  if (input == null || input === "") return [];
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    let key = normalizeAmenityKey(item);
    if (!key) continue;
    key = resolveCanonicalAmenityValue(key);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Display label for chips / list. Uses `locale` when labels exist; otherwise title-case.
 * @param {string} key - canonical amenity value
 * @param {string} [locale] - `"ar"` | `"en"` | other → English
 */
export function getAmenityLabel(key, locale = "en") {
  const k = normalizeAmenityKey(key);
  if (!k) return "";
  const canonical = resolveCanonicalAmenityValue(k);
  const row = PROJECT_AMENITY_LABELS[canonical];
  if (row) {
    return locale === "ar" ? row.ar : row.en;
  }
  return formatAmenityLabelFallback(canonical);
}

/**
 * @deprecated Use `getAmenityLabel(key, "en")` for catalog entries; kept for generic fallback.
 */
export function formatAmenityLabel(key) {
  const k = normalizeAmenityKey(key);
  if (!k) return "";
  const canonical = resolveCanonicalAmenityValue(k);
  if (PROJECT_AMENITY_LABELS[canonical]) {
    return PROJECT_AMENITY_LABELS[canonical].en;
  }
  return formatAmenityLabelFallback(canonical);
}

function formatAmenityLabelFallback(canonical) {
  return canonical
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Ordered options: defaults in enum order, then custom keys from value not in catalog.
 */
export function buildAmenityOptions(value, defaults = DEFAULT_PROJECT_AMENITIES) {
  const set = new Set(defaults);
  const customs = normalizeAmenitiesArray(value).filter((v) => !set.has(v));
  return [...defaults, ...customs.sort((a, b) => a.localeCompare(b))];
}
