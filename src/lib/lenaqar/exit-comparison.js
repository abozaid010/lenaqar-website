/**
 * Illustrative cancel-vs-sell arithmetic from the published worked example
 * (unit 10M, paid 2M, 15% of full price). Not a quote — penalties and
 * refund schedules are contract- and developer-specific.
 */
export const ILLUSTRATIVE_CANCEL_PENALTY_RATE = 0.15;
export const ILLUSTRATIVE_REFUND_YEARS = 3;

export const WORKED_EXAMPLE_INPUTS = {
  unitPrice: 10_000_000,
  amountPaid: 2_000_000,
};

export function computeExitComparison({
  unitPrice,
  amountPaid,
  cancelPenaltyRate = ILLUSTRATIVE_CANCEL_PENALTY_RATE,
}) {
  const price = Number(unitPrice);
  const paid = Number(amountPaid);
  if (!(price > 0) || !(paid >= 0) || paid > price) return null;

  const cancelPenalty = price * cancelPenaltyRate;
  const cancelReceives = Math.max(0, paid - cancelPenalty);
  const sellThroughUs = paid;

  return {
    unitPrice: price,
    amountPaid: paid,
    cancelPenaltyRate,
    cancelPenalty,
    cancelReceives,
    refundYears: ILLUSTRATIVE_REFUND_YEARS,
    sellThroughUs,
  };
}
