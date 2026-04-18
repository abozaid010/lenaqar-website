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
 * Read raw amenities/facilities from API project payload. Backend often stores selected
 * amenities under `facilities` while the form uses `amenities` internally.
 * Supports string[], comma-separated string, array of { name | value | slug }, or record flags.
 */
export function extractAmenitiesSourceFromProject(projectData) {
  if (projectData == null) return null;
  const nested = projectData.project;
  const raw =
    projectData.amenities ??
    projectData.facilities ??
    nested?.amenities ??
    nested?.facilities;

  if (raw == null || raw === "") return null;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0];
    if (typeof first === "string" || typeof first === "number") {
      return raw;
    }
    if (typeof first === "object" && first !== null) {
      return raw
        .map((item) => {
          if (item == null) return "";
          if (typeof item === "string" || typeof item === "number") {
            return String(item);
          }
          return (
            item.name ??
            item.value ??
            item.slug ??
            item.id ??
            item.en_name ??
            item.ar_name ??
            item.label ??
            ""
          );
        })
        .filter((s) => s !== "" && s != null);
    }
  }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const keys = Object.keys(raw).filter(
      (k) => raw[k] === true || raw[k] === 1 || raw[k] === "1"
    );
    if (keys.length > 0) return keys;
    const vals = Object.values(raw).filter(
      (v) => typeof v === "string" && String(v).trim()
    );
    if (vals.length > 0) return vals;
  }
  return null;
}

/** Normalized string[] for form state from `amenities` and/or `facilities` on project. */
export function normalizeAmenitiesFromProject(projectData) {
  return normalizeAmenitiesArray(extractAmenitiesSourceFromProject(projectData));
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
