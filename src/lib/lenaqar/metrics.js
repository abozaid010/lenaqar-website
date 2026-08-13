/**
 * Cash multiple = totalPrice / downPayment.
 * Two inputs, both from the API. No composite score, no discount %, no forecast.
 */
export function cashMultiple(totalPrice, downPayment) {
  const total = Number(totalPrice);
  const cash = Number(downPayment);
  if (!(cash > 0) || !Number.isFinite(total)) return null;
  return total / cash;
}

export function formatCashMultiple(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(1);
}

/** Tabular Latin numerals; callers place ج.م in a fixed adjacent slot. */
export function formatEgpNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

/** سعر المتر from allowlisted fields only. Hidden when either input is absent. */
export function pricePerMeter(totalPrice, landArea) {
  const total = Number(totalPrice);
  const area = Number(landArea);
  if (!(total > 0) || !(area > 0)) return null;
  return total / area;
}
