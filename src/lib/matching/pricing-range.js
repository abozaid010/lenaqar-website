export const MIN_RANGE_PERCENT = 0.2;
export const MAX_RANGE_PERCENT = 0.2;

function toPositiveNumber(value) {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

/**
 * Normalize a requirement price into a tolerant search range.
 * Explicit bounds are expanded by 20%; a single value remains the lower bound.
 *
 * @param {{ min?: unknown, max?: unknown, single?: unknown }} values
 * @returns {{ min: number | null, max: number | null } | null}
 */
export function normalizePricingRange(values = {}) {
  const min = toPositiveNumber(values.min);
  const max = toPositiveNumber(values.max);

  if (min != null || max != null) {
    return {
      min: min == null ? null : min * (1 - MIN_RANGE_PERCENT),
      max: max == null ? null : max * (1 + MAX_RANGE_PERCENT),
    };
  }

  const single = toPositiveNumber(values.single);
  if (single == null) return null;

  return {
    min: single,
    max: single * (1 + MAX_RANGE_PERCENT),
  };
}
