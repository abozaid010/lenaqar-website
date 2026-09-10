import { placeAr } from "@/lib/lenaqar/listing-seo";

/**
 * Exact `preferred_locations[].city` / `city` tokens from the CRM feed.
 * Labels reuse the shared Arabic place map — never invent alternate API values.
 */
export const MARKETPLACE_CITY_FILTERS = [
  { value: "cairo", label: placeAr("cairo") || "cairo" },
  { value: "6 october", label: placeAr("6 october") || "6 october" },
  { value: "north coast", label: placeAr("north coast") || "north coast" },
  { value: "sheikh zayed", label: placeAr("sheikh zayed") || "sheikh zayed" },
];

/**
 * @param {{ locations?: { city?: string }[] }} requirement
 * @param {string} cityValue exact API city token, or "" for all
 */
export function requirementMatchesCity(requirement, cityValue) {
  const wanted = String(cityValue || "").trim().toLowerCase();
  if (!wanted) return true;
  const locations = Array.isArray(requirement?.locations)
    ? requirement.locations
    : [];
  return locations.some(
    (loc) => String(loc?.city || "").trim().toLowerCase() === wanted,
  );
}
