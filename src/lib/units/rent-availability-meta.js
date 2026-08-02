/**
 * Slim-list currently omits availabilityDate / rentSearchEligible.
 * Full docs (`/units/all`, by-code, details) include them — merge when the
 * list may contain ineligible rent units (filter false or both).
 *
 * Call after `applyRentSearchEligibleToApiParams`:
 * - true → key set true (skip merge)
 * - false → key set false (merge)
 * - both → key omitted (merge)
 */

function isRentPurpose(purpose) {
  const p = String(purpose || "").trim().toLowerCase();
  return p === "rent" || p === "lease";
}

export function needsRentAvailabilityMeta(listParams) {
  if (!listParams || typeof listParams !== "object") return false;
  if (!isRentPurpose(listParams.purpose)) return false;
  if (
    !Object.prototype.hasOwnProperty.call(listParams, "rentSearchEligible") &&
    !Object.prototype.hasOwnProperty.call(listParams, "rent_search_eligible")
  ) {
    return true;
  }
  const raw = listParams.rentSearchEligible ?? listParams.rent_search_eligible;
  return (
    raw === false ||
    raw === "false" ||
    raw === "both" ||
    raw === 0 ||
    raw === "0"
  );
}

export function pickRentAvailabilityMeta(unit) {
  if (!unit || typeof unit !== "object") return null;
  const availabilityDate =
    unit.availabilityDate ?? unit.availability_date ?? null;
  const raw = unit.rentSearchEligible ?? unit.rent_search_eligible;
  const rentSearchEligible =
    raw === false || raw === "false" || raw === 0 || raw === "0"
      ? false
      : raw === true || raw === "true" || raw === 1 || raw === "1"
        ? true
        : raw == null
          ? null
          : Boolean(raw);
  if (availabilityDate == null && rentSearchEligible == null) return null;
  return { availabilityDate, rentSearchEligible };
}

export function unitListMergeKey(unit) {
  if (!unit || typeof unit !== "object") return "";
  const id = unit.unitId ?? unit.unit_id ?? unit.id;
  if (id != null && String(id).trim()) return `id:${String(id).trim()}`;
  const code = unit.code;
  if (code != null && String(code).trim()) return `code:${String(code).trim()}`;
  return "";
}

/**
 * Overlay availabilityDate + rentSearchEligible from a fuller unit list onto slim rows.
 */
export function mergeRentAvailabilityMeta(slimUnits, fullerUnits) {
  if (!Array.isArray(slimUnits) || slimUnits.length === 0) return slimUnits;
  if (!Array.isArray(fullerUnits) || fullerUnits.length === 0) return slimUnits;

  const metaByKey = new Map();
  for (const unit of fullerUnits) {
    const key = unitListMergeKey(unit);
    const meta = pickRentAvailabilityMeta(unit);
    if (key && meta) metaByKey.set(key, meta);
  }
  if (metaByKey.size === 0) return slimUnits;

  return slimUnits.map((unit) => {
    const meta = metaByKey.get(unitListMergeKey(unit));
    if (!meta) return unit;
    return {
      ...unit,
      availabilityDate: meta.availabilityDate ?? unit.availabilityDate ?? null,
      rentSearchEligible:
        meta.rentSearchEligible ?? unit.rentSearchEligible ?? null,
    };
  });
}
