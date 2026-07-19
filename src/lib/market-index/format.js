/**
 * Display helpers for Market Index evaluate.
 * Western digits only; currency label is always "EGP". Do not re-round money.
 */

export function formatEgp(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  return `${new Intl.NumberFormat("en-US").format(Number(amount))} EGP`;
}

/** ROI fraction → percent string, e.g. 0.0675 → "6.75%" */
export function formatRoiPercent(roi) {
  if (roi == null || Number.isNaN(Number(roi))) return null;
  return `${(Number(roi) * 100).toFixed(2)}%`;
}

export function formatIsoDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
