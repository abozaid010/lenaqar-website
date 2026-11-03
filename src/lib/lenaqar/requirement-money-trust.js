/**
 * Reviewed source conflicts, observed on the public homepage 2026-11-03.
 * This is deliberately not a heuristic parser of Egyptian financial prose.
 * 61240565aa04: structured monthly 85,000 vs note 8,500.
 * f4eaaa7a591f: structured max/down/monthly 2m/500k/25k vs 1m/400k/18,750.
 * Neither representation is verified. Review upstream before removing a hold.
 */
const MONEY_REVIEW_IDS = new Set(["61240565aa04", "f4eaaa7a591f"]);

export function applyRequirementMoneyTrust(row) {
  if (!row || !MONEY_REVIEW_IDS.has(String(row.id).toLowerCase())) return row;
  // Notes contain the contradictory claims; do not leak them in RSC either.
  // Preserve property/location/delivery criteria and the anonymous request id.
  const {
    minPrice: _min, maxPrice: _max, downPayment: _down,
    monthlyInstallment: _monthly, notes: _notes, ...safe
  } = row;
  return { ...safe, moneyReviewRequired: true };
}
