/** Max gallery images for the add/edit unit flow (images step + uploader). */
export const MAX_UNIT_IMAGES = 10;

/**
 * Hydrate monthly rent for the rent form from a unit document.
 * Prefers `monthlyRentPrice`; falls back to mirrored `totalPrice` during migration.
 */
export function resolveMonthlyRentFromUnit(unit) {
  if (!unit || typeof unit !== "object") return "";
  const monthly = Number(unit.monthlyRentPrice);
  if (Number.isFinite(monthly) && monthly > 0) return monthly;
  const mirrored = Number(unit.totalPrice);
  if (Number.isFinite(mirrored) && mirrored > 0) return mirrored;
  return "";
}
