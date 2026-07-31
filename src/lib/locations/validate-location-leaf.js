/**
 * Shared leaf-location validation for unit forms, requirements, and filters.
 *
 * A location is valid only when it points at a leaf in the hierarchy:
 * - City → District → Subdistrict → Project
 * - City → District → Subdistrict
 * - City → District → Project (district has no subdistricts)
 * - City → District (district has no subdistricts)
 *
 * Rejects city-only, empty selection, and district when that district has subdistricts.
 */

import { LOCATION_VALIDATION_KEYS as K } from "@/lib/locations/location-validation-keys";

function asTrimmedString(value) {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * @param {object} location
 * @param {object|null} cityManager - CityManager instance (optional; weaker checks without it)
 * @returns {Promise<{ ok: true } | { ok: false, key: string, field: string }>}
 */
export async function validateLocationLeaf(location = {}, cityManager) {
  const project = asTrimmedString(
    location.project || location.project_id || location.projectId,
  );
  const city = asTrimmedString(location.city);
  const district = asTrimmedString(location.district);
  const sub_district = asTrimmedString(location.sub_district);

  const fail = (key) => ({
    ok: false,
    key,
    field: "unit_location",
  });

  if (!city && !district && !sub_district && !project) {
    return fail(K.locationRequired);
  }

  // Project selected but parents not resolved yet (filled before save).
  if (!city || !district) {
    if (project) return { ok: true };
    if (city && !district) return fail(K.locationSelectDistrict);
    return fail(K.locationRequired);
  }

  if (!cityManager) {
    if (sub_district || project) return { ok: true };
    return fail(K.locationSelectDeepest);
  }

  await cityManager.initializeData();
  const resolved = cityManager.resolveLocationHierarchy
    ? cityManager.resolveLocationHierarchy({ city, district, sub_district })
    : { city, district, sub_district };

  if (!resolved.city || !resolved.district) {
    if (project) return { ok: true };
    if (resolved.city && !resolved.district) {
      return fail(K.locationSelectDistrict);
    }
    return fail(K.locationRequired);
  }

  const cityObj = await cityManager.getCityByValue(resolved.city);
  if (!cityObj) {
    if (resolved.sub_district || project) return { ok: true };
    return fail(K.locationSelectDeepest);
  }

  const subs = await cityManager.getSubDistrictsForCityDistrict(
    cityObj.id,
    resolved.district,
  );

  if (subs.length > 0) {
    if (resolved.sub_district) return { ok: true };
    return fail(K.locationSelectSubdistrict);
  }

  // District has no subdistricts — district itself is a valid leaf.
  return { ok: true };
}

/** Convenience boolean wrapper around validateLocationLeaf. */
export async function isValidLocationLeaf(location = {}, cityManager) {
  const result = await validateLocationLeaf(location, cityManager);
  return result.ok;
}
