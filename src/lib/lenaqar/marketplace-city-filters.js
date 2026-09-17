import { placeAr } from "./listing-seo.js";

function token(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Homepage city chips. `value` is the canonical public-API city token.
 * `aliases` also match district / subDistrict (CRM sometimes stores New Cairo
 * under Cairo, or October as `6th of october`).
 * `exclude` keeps overlapping places on their own chip (Cairo vs New Cairo).
 */
export const MARKETPLACE_CITY_FILTERS = [
  {
    value: "cairo",
    label: placeAr("cairo") || "cairo",
    aliases: ["cairo"],
    exclude: ["new cairo"],
  },
  {
    value: "new cairo",
    label: placeAr("new cairo") || "new cairo",
    aliases: ["new cairo"],
  },
  {
    value: "6 october",
    label: placeAr("6 october") || "6 october",
    aliases: [
      "6 october",
      "6 october city",
      "6th of october",
      "sixth of october",
    ],
  },
  {
    value: "north coast",
    label: placeAr("north coast") || "north coast",
    aliases: ["north coast"],
  },
  {
    value: "sheikh zayed",
    label: placeAr("sheikh zayed") || "sheikh zayed",
    aliases: ["sheikh zayed"],
  },
  {
    value: "new administrative capital",
    label: placeAr("new administrative capital") || "new capital",
    aliases: ["new administrative capital", "new capital"],
  },
];

const FILTERS_BY_VALUE = new Map(
  MARKETPLACE_CITY_FILTERS.map((city) => [city.value, city]),
);

function locationTokens(location) {
  return [
    token(location?.city),
    token(location?.district),
    token(location?.subDistrict),
  ].filter(Boolean);
}

/**
 * @param {{ locations?: { city?: string, district?: string, subDistrict?: string }[] }} requirement
 * @param {string} cityValue exact API city token, or "" for all
 */
export function requirementMatchesCity(requirement, cityValue) {
  const wanted = token(cityValue);
  if (!wanted) return true;

  const spec = FILTERS_BY_VALUE.get(wanted);
  const aliases = new Set((spec?.aliases || [wanted]).map(token));
  const excluded = new Set((spec?.exclude || []).map(token));

  const locations = Array.isArray(requirement?.locations)
    ? requirement.locations
    : [];

  return locations.some((loc) => {
    const tokens = locationTokens(loc);
    if (tokens.some((item) => excluded.has(item))) return false;
    return tokens.some((item) => aliases.has(item));
  });
}
