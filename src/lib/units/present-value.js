/**
 * Present-value display helpers for secondary sale units.
 * presentValue / pricePerMeter are backend-owned; never invent from totalPrice.
 */

import { isRentPurpose } from "@/lib/units/unit-price";

/**
 * @param {unknown} value
 * @returns {number | null}
 */
export function toNullableFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} unit
 * @returns {boolean}
 */
export function isPrimaryUnit(unit) {
  if (!unit || typeof unit !== "object") return false;
  if (typeof unit.isPrimary === "boolean") return unit.isPrimary;
  if (typeof unit.is_primary === "boolean") return unit.is_primary;
  return Boolean(unit.is_primary ?? unit.isPrimary);
}

/**
 * Secondary sale only — rent and primary never expose PV UI.
 * @param {Record<string, unknown> | null | undefined} unit
 * @returns {boolean}
 */
export function canShowPresentValue(unit) {
  if (!unit || typeof unit !== "object") return false;
  if (isRentPurpose(unit.purpose)) return false;
  if (isPrimaryUnit(unit)) return false;
  return toNullableFiniteNumber(unit.presentValue) != null;
}

/**
 * Prefer API pricePerMeter; fallback to presentValue / area when both exist.
 * @param {Record<string, unknown> | null | undefined} unit
 * @returns {number | null}
 */
export function resolvePricePerMeter(unit) {
  if (!canShowPresentValue(unit)) return null;

  const fromApi = toNullableFiniteNumber(unit.pricePerMeter);
  if (fromApi != null) return fromApi;

  const presentValue = toNullableFiniteNumber(unit.presentValue);
  const area = toNullableFiniteNumber(
    unit.landArea ?? unit.area ?? unit.land_area
  );
  if (presentValue == null || area == null || area <= 0) return null;
  return presentValue / area;
}

/**
 * @param {Record<string, unknown> | null | undefined} unit
 * @returns {number | null}
 */
export function resolvePresentValue(unit) {
  if (!canShowPresentValue(unit)) return null;
  return toNullableFiniteNumber(unit.presentValue);
}
