/**
 * Maps `/units/v1/slim-list` rows to the list-card shape used by UnitsGrid.
 * Full unit documents are still loaded on detail pages via /units/details or /units/by-code.
 *
 * Slim API shape (verified):
 * { id, code, purpose, totalPrice, monthlyRentPrice, district, project,
 *   property_type, city, area, bedrooms, image, owner_mobile? }
 */

import {
  isRentPurpose,
  resolveMonthlyRentPrice,
  resolveSaleTotalPrice,
} from "@/lib/units/unit-price";

export function normalizeSlimPurpose(purpose) {
  if (purpose == null || purpose === "") return purpose;
  const normalized = String(purpose).toLowerCase();
  if (normalized === "sale") return "sell";
  return normalized;
}

/**
 * @param {Record<string, unknown> | null | undefined} slim
 * @returns {Record<string, unknown> | null | undefined}
 */
export function mapSlimUnitToListItem(slim) {
  if (!slim || typeof slim !== "object") return slim;

  const purpose = normalizeSlimPurpose(slim.purpose);
  const isRent = isRentPurpose(purpose);
  const monthlyRentPrice = isRent ? resolveMonthlyRentPrice(slim) : null;
  const totalPrice = isRent
    ? monthlyRentPrice
    : resolveSaleTotalPrice(slim) ?? toNullableNumber(slim.totalPrice);

  const imageUrl = slim.image;
  const existingImages = Array.isArray(slim.images) ? slim.images : [];

  const images =
    existingImages.length > 0
      ? existingImages
      : imageUrl
        ? [{ url: String(imageUrl), fileId: "", source: "slim" }]
        : [];

  const buildingType = slim.buildingType ?? slim.property_type ?? null;
  const project = slim.project ?? null;
  const ownerMobile = slim.owner_mobile ?? slim.ownerMobile ?? null;

  return {
    ...slim,
    unitId: slim.unitId ?? slim.unit_id ?? slim.id ?? null,
    code: slim.code ?? null,
    purpose,
    buildingType,
    project,
    owner_mobile: ownerMobile,
    ownerMobile,
    unitTitle:
      slim.unitTitle ??
      slim.unit_title ??
      slim.title ??
      (project && buildingType ? `${project} - ${buildingType}` : project) ??
      slim.code ??
      null,
    city: slim.city ?? null,
    district: slim.district ?? null,
    totalPrice,
    monthlyRentPrice: isRent ? monthlyRentPrice : null,
    landArea: slim.landArea ?? slim.area ?? null,
    roomsCount: slim.roomsCount ?? slim.bedrooms ?? null,
    images,
  };
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} responseData
 * @returns {Record<string, unknown> | null | undefined}
 */
export function mapSlimUnitsListResponse(responseData) {
  if (!responseData?.data?.units || !Array.isArray(responseData.data.units)) {
    return responseData;
  }

  return {
    ...responseData,
    data: {
      ...responseData.data,
      units: responseData.data.units.map(mapSlimUnitToListItem),
    },
  };
}

/**
 * @param {{ units?: unknown[] } | null | undefined} data
 * @returns {{ units: Record<string, unknown>[]; pagination?: unknown; count?: number }}
 */
export function mapSlimPublicUnitsPayload(data) {
  const units = Array.isArray(data?.units)
    ? data.units.map(mapSlimUnitToListItem)
    : [];

  return {
    units,
    pagination: data?.pagination,
    count: data?.count ?? units.length,
  };
}
