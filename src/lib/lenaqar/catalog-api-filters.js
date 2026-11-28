/**
 * The filters `/public/v1/units` applies server-side, re-applied in process to
 * the unfiltered catalogue, so a filtered listing never needs its own walk.
 *
 * Mirrors LENAAI-Agent `get_filtered_by_client_units` (2026-11-28):
 * - city, district, sub_district: equality with the lowercased value
 *   (units store location fields lowercased)
 * - project_name: exact equality with `project`
 * - bedrooms: `roomsCount == bedrooms`
 * - min_price / max_price: inclusive range on the sale `totalPrice`; a unit
 *   without a price is dropped when either bound is set; max < min → nothing
 *
 * Input units are feed items (to-public-opportunity shape: trimmed strings,
 * numeric roomsCount / totalPrice).
 */

function text(value) {
  return value == null ? "" : String(value).trim();
}

function lowerEquals(value, wanted) {
  const want = text(wanted).toLowerCase();
  if (!want) return true;
  return text(value).toLowerCase() === want;
}

function exactEquals(value, wanted) {
  const want = text(wanted);
  if (!want) return true;
  return text(value) === want;
}

/** Same parsing as the backend: a number ≥ 0, or no bound. */
function bound(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function wholeNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function hasCatalogApiFilters(filters = {}) {
  return ["city", "district", "subDistrict", "project", "minPrice", "maxPrice", "bedrooms"].some(
    (key) => text(filters?.[key]) !== "",
  );
}

export function applyCatalogApiFilters(
  units,
  { city, district, subDistrict, project, minPrice, maxPrice, bedrooms } = {},
) {
  const min = bound(minPrice);
  const max = bound(maxPrice);
  if (min != null && max != null && max < min) return [];
  const rooms = wholeNumber(bedrooms);

  return units.filter((unit) => {
    if (!lowerEquals(unit.city, city)) return false;
    if (!lowerEquals(unit.district, district)) return false;
    if (!lowerEquals(unit.subDistrict, subDistrict)) return false;
    if (!exactEquals(unit.project, project)) return false;
    if (rooms != null && Number(unit.roomsCount) !== rooms) return false;
    if (min != null || max != null) {
      const price = Number(unit.totalPrice);
      if (unit.totalPrice == null || !Number.isFinite(price)) return false;
      if (min != null && price < min) return false;
      if (max != null && price > max) return false;
    }
    return true;
  });
}
