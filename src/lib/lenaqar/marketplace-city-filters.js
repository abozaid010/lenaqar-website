import { placeAr } from "./listing-seo.js";

function token(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Homepage city chips. `value` MUST be the catalog city `en_name`
 * lowercased (see GET /api/locations/catalog → cities[].en_name), e.g.
 * "New Administrative Capital" → "new administrative capital".
 *
 * Never use short aliases like "new capital" as `value` — those only belong
 * in `aliases` so legacy / short tokens still match.
 */
export const MARKETPLACE_CITY_FILTERS = [
  {
    value: "cairo",
    label: placeAr("cairo") || "القاهرة",
    aliases: ["cairo"],
    exclude: ["new cairo"],
  },
  {
    value: "new cairo",
    label: placeAr("new cairo") || "القاهرة الجديدة",
    aliases: ["new cairo"],
  },
  {
    value: "6 october",
    label: placeAr("6 october") || "السادس من أكتوبر",
    aliases: [
      "6 october",
      "6 october city",
      "6th of october",
      "sixth of october",
    ],
  },
  {
    value: "north coast",
    label: placeAr("north coast") || "الساحل الشمالي",
    aliases: ["north coast"],
  },
  {
    value: "sheikh zayed",
    label: placeAr("sheikh zayed") || "الشيخ زايد",
    aliases: ["sheikh zayed"],
  },
  {
    // Catalog: en_name "New Administrative Capital" (aliases include "new capital")
    value: "new administrative capital",
    label: placeAr("new administrative capital") || "العاصمة الإدارية الجديدة",
    aliases: [
      "new administrative capital",
      "new capital",
      "the new administrative capital",
    ],
  },

];

const FILTERS_BY_VALUE = new Map(
  MARKETPLACE_CITY_FILTERS.map((city) => [city.value, city]),
);

/**
 * Map any known alias to the catalog city token used in the units API.
 * Unknown values pass through unchanged.
 * @param {unknown} raw
 * @returns {string}
 */
export function resolveMarketplaceCityToken(raw) {
  const wanted = token(raw);
  if (!wanted) return "";
  for (const city of MARKETPLACE_CITY_FILTERS) {
    const aliases = (city.aliases || [city.value]).map(token);
    if (aliases.includes(wanted) || token(city.value) === wanted) {
      return city.value;
    }
  }
  return wanted;
}

/**
 * Exact city match with catalog alias support
 * (`new capital` ≡ `new administrative capital`).
 * @param {unknown} actual
 * @param {unknown} wanted empty wanted → always true
 */
export function marketplaceCitiesMatch(actual, wanted) {
  const right = token(wanted);
  if (!right) return true;
  return resolveMarketplaceCityToken(actual) === resolveMarketplaceCityToken(wanted);
}

function locationTokens(location) {
  return [
    token(location?.city),
    token(location?.district),
    token(location?.subDistrict),
  ].filter(Boolean);
}

/**
 * @param {{ locations?: { city?: string, district?: string, subDistrict?: string }[] }} requirement
 * @param {string} cityValue catalog city token (or alias), or "" for all
 */
export function requirementMatchesCity(requirement, cityValue) {
  const wanted = token(cityValue);
  if (!wanted) return true;

  const canonical = resolveMarketplaceCityToken(wanted);
  const spec = FILTERS_BY_VALUE.get(canonical);
  const aliases = new Set((spec?.aliases || [canonical]).map(token));
  const excluded = new Set((spec?.exclude || []).map(token));

  const locations = Array.isArray(requirement?.locations)
    ? requirement.locations
    : [];

  return locations.some((loc) => {
    const tokens = locationTokens(loc);
    if (tokens.some((item) => excluded.has(item))) return false;
    return tokens.some(
      (item) =>
        aliases.has(item) || resolveMarketplaceCityToken(item) === canonical,
    );
  });
}
