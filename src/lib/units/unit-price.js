/**
 * Flat unit pricing contract (verified against API):
 * - Sale (`purpose: sell`): read `totalPrice`; `monthlyRentPrice` is null.
 * - Rent (`purpose: rent`): read `monthlyRentPrice`; `totalPrice` mirrors monthly.
 * - Do not invent or decode a top-level `price` field.
 */

function toPositiveNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isRentPurpose(purpose) {
  const p = String(purpose || "").toLowerCase();
  return p === "rent" || p === "lease";
}

/**
 * Monthly rent amount. Prefer `monthlyRentPrice`; fall back to mirrored
 * `totalPrice` only while older docs are still migrating.
 */
export function resolveMonthlyRentPrice(unit) {
  if (!unit || typeof unit !== "object") return null;
  return (
    toPositiveNumber(unit.monthlyRentPrice) ??
    toPositiveNumber(unit.totalPrice)
  );
}

/** Sale total price. */
export function resolveSaleTotalPrice(unit) {
  if (!unit || typeof unit !== "object") return null;
  return toPositiveNumber(unit.totalPrice);
}

/**
 * Display amount for cards/details: rent → monthly; sale → total.
 */
export function resolveUnitDisplayPrice(unit) {
  if (!unit || typeof unit !== "object") return null;
  if (isRentPurpose(unit.purpose)) {
    return resolveMonthlyRentPrice(unit);
  }
  return resolveSaleTotalPrice(unit);
}
