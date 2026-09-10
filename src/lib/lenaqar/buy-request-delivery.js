/** Exact `deliveryDate` tokens verified against `/public/v1/buy-request/submit`. */
export const BUY_REQUEST_DELIVERY_VALUES = [
  "ready",
  "less_than_1_year",
  "less_than_2_years",
  "less_than_3_years",
  "less_than_4_years",
  "less_than_5_years",
];

const DELIVERY_SET = new Set(BUY_REQUEST_DELIVERY_VALUES);

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeBuyRequestDelivery(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (DELIVERY_SET.has(raw)) return raw;
  // Legacy aliases seen in CRM / older forms.
  if (raw === "immediate" || raw === "delivered") return "ready";
  return "";
}

/**
 * @param {(key: string, fallback?: string) => string} translate
 */
export function getBuyRequestDeliveryOptions(translate) {
  return BUY_REQUEST_DELIVERY_VALUES.map((value) => ({
    value,
    label: translate(`lenaqar.buyRequest.deliveryOptions.${value}`, value),
  }));
}
