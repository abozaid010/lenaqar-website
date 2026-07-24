/** Max gallery images for the add/edit unit flow (images step + uploader). */
export const MAX_UNIT_IMAGES = 10;

/** Supported rent duration tabs, in display order. */
// TEMP: daily/weekly hidden — focus on monthly rent only. Restore when re-enabled.
// export const RENT_DURATION_KEYS = ["daily", "weekly", "monthly"];
export const RENT_DURATION_KEYS = ["monthly"];

/** Full set kept for API normalize so existing daily/weekly data is not dropped. */
// TEMP: restore when daily/weekly UI is re-enabled.
export const RENT_DURATION_KEYS_ALL = ["daily", "weekly", "monthly"];

/** Numeric (money) fields that live inside every rent duration block. */
export const RENT_DURATION_AMOUNT_FIELDS = [
  "price",
  "securityDeposit",
  "cleaningFee",
  "serviceFee",
];

/** Default (empty) values for a single rent duration block; amounts default to 0. */
export function createDefaultRentDurationBlock() {
  return {
    price: 0,
    securityDeposit: 0,
    cleaningFee: 0,
    serviceFee: 0,
    currency: "EGP",
  };
}

/**
 * Normalize a single (possibly missing/null/partial) rent duration block into a
 * complete block. Existing values from the backend are preserved; only missing
 * or null amount fields fall back to 0 so the UI never renders `undefined`.
 */
export function normalizeRentDurationBlock(raw) {
  const block = raw && typeof raw === "object" ? raw : {};
  const normalized = { ...createDefaultRentDurationBlock(), ...block };
  RENT_DURATION_AMOUNT_FIELDS.forEach((field) => {
    if (normalized[field] === null || normalized[field] === undefined) {
      normalized[field] = 0;
    }
  });
  if (normalized.currency == null) normalized.currency = "EGP";
  return normalized;
}

/**
 * Normalize a (possibly null/partial) `rentDurationType` from the API into a
 * complete object that always contains daily/weekly/monthly with every field
 * defined. Backend values are never overwritten; missing durations/fields fall
 * back to defaults so the form can be rendered and edited safely.
 */
export function normalizeRentDurationType(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  // Keep all duration keys in the payload shape so existing daily/weekly
  // values from the API are preserved even while the UI is monthly-only.
  return RENT_DURATION_KEYS_ALL.reduce((acc, key) => {
    acc[key] = normalizeRentDurationBlock(source[key]);
    return acc;
  }, {});
}
