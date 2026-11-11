/**
 * Average asking prices shown after a buy request is submitted.
 *
 * `priceInsightQuery` turns the submitted requirement into the query for
 * `GET /public/v1/price-insight`: the place, the property type and what narrows
 * them (rooms, area, delivery). Budget, contact and notes never leave the page.
 *
 * `toPriceInsightView` turns the backend answer into the few fields the success
 * card prints. The figures are medians over listed resale units at their cash
 * value: developer units and installment totals are left out by the backend, so
 * the numbers match what a buyer sees on resale listing cards. The backend widens the search when too few units match and says
 * which scope the figures cover, so the label always follows `scope` — a
 * city-wide average is never printed as a district price. Anything that is not a
 * complete answer becomes `null` and the card shows no price block at all.
 */

/** Label of a country-wide figure (scope level "country"). */
const COUNTRY = { en: "egypt", ar: "مصر" };

function cleanToken(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function positiveNumber(value) {
  if (value === "" || value == null || typeof value === "boolean") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function firstLocation(requirement) {
  const locations = Array.isArray(requirement.preferred_locations)
    ? requirement.preferred_locations
    : [];
  const stored = locations.find(
    (place) => place && typeof place === "object" && cleanToken(place.city),
  );
  return stored || requirement;
}

function firstPropertyType(requirement) {
  const flat = Array.isArray(requirement.buildingType)
    ? requirement.buildingType[0]
    : requirement.buildingType;
  if (cleanToken(flat)) return cleanToken(flat);
  const types = Array.isArray(requirement.preferred_property_types)
    ? requirement.preferred_property_types
    : [];
  return cleanToken(types.find((value) => cleanToken(value)));
}

/**
 * @param {Record<string, unknown> | null | undefined} requirement
 * @returns {Record<string, string | number> | null} null when there is no city or no property type
 */
export function priceInsightQuery(requirement) {
  if (!requirement || typeof requirement !== "object") return null;

  const place = firstLocation(requirement);
  const city = cleanToken(place.city);
  const propertyType = firstPropertyType(requirement);
  if (!city || !propertyType) return null;

  const query = { city };
  const district = cleanToken(place.district);
  if (district) query.district = district;
  const subDistrict = cleanToken(place.sub_district);
  if (subDistrict) query.sub_district = subDistrict;
  query.property_type = propertyType;

  const area = positiveNumber(requirement.land_area);
  if (area != null) query.area = area;
  const bedrooms = positiveNumber(requirement.roomsCount);
  if (bedrooms != null) query.bedrooms = Math.round(bedrooms);
  const delivery = cleanToken(requirement.deliveryDate);
  if (delivery) query.delivery = delivery;

  return query;
}

/**
 * @param {unknown} data `data` of the backend response
 * @param {(value: string) => string} [placeAr] Arabic name of a catalog place, "" when unknown
 * @returns {null | {
 *   level: string,
 *   place: { en: string, ar: string },
 *   propertyType: string,
 *   perMeter: number,
 *   unitPrice: number,
 *   lowest: number,
 *   highest: number,
 *   estimated: number | null,
 *   count: number,
 *   asOf: string,
 * }}
 */
export function toPriceInsightView(data, placeAr = () => "") {
  if (!data || typeof data !== "object" || data.available !== true) return null;

  const scope = data.scope && typeof data.scope === "object" ? data.scope : {};
  // The backend widens to the whole country when even the city has too few units.
  const countryWide = cleanToken(scope.level) === "country";
  const placeEn = countryWide
    ? COUNTRY.en
    : cleanToken(scope.sub_district) || cleanToken(scope.district) || cleanToken(scope.city);
  const perMeter = positiveNumber(data.median_price_per_sqm);
  const unitPrice = positiveNumber(data.median_unit_price);
  const lowest = positiveNumber(data.lowest_unit_price);
  const highest = positiveNumber(data.highest_unit_price);
  const count = positiveNumber(data.sample_size);
  if (!placeEn || perMeter == null || unitPrice == null || lowest == null || highest == null || count == null) {
    return null;
  }

  const estimated = positiveNumber(data.estimated_total);
  return {
    level: cleanToken(scope.level) || "city",
    place: countryWide
      ? { ...COUNTRY }
      : { en: placeEn, ar: String(placeAr(placeEn) || "") },
    propertyType: cleanToken(scope.property_type),
    perMeter: Math.round(perMeter),
    unitPrice: Math.round(unitPrice),
    lowest: Math.round(lowest),
    highest: Math.round(highest),
    estimated: estimated == null ? null : Math.round(estimated),
    count: Math.round(count),
    asOf: typeof data.as_of === "string" ? data.as_of : "",
  };
}
