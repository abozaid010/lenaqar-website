import type { RawUnit, UnitImage } from "@/lib/units/unit-types";

/** Build an update-rent / update-sale payload with merged images only. */
export function buildUnitImagesUpdatePayload(
  rawUnit: RawUnit,
  mergedImages: UnitImage[],
): Record<string, unknown> {
  return {
    ...rawUnit,
    unitId: rawUnit.unitId,
    purpose: rawUnit.purpose,
    images: mergedImages.map(({ url, fileId, source }) => ({
      url,
      fileId,
      ...(source ? { source } : {}),
    })),
  };
}
