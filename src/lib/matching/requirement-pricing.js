/** Pricing fields that make a requirement matchable (at least one required). */
export const MATCHABLE_PRICING_FIELDS = [
  "min_price",
  "max_price",
  "totalPrice",
  "monthlyInstallment",
  "downPayment",
];

function toPositiveNumber(value) {
  if (value == null || value === "") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const n = toPositiveNumber(item);
      if (n != null) return n;
    }
    return null;
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    return toPositiveNumber(value.value);
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * A requirement is matchable when at least one price-related value exists.
 * @param {Record<string, unknown> | null | undefined} requirement
 * @returns {boolean}
 */
export function hasMatchablePricing(requirement) {
  if (!requirement || typeof requirement !== "object" || requirement.error) {
    return false;
  }
  return MATCHABLE_PRICING_FIELDS.some(
    (field) => toPositiveNumber(requirement[field]) != null,
  );
}
