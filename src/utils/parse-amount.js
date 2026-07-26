/**
 * Money/amount parsing for form state, validation, and API payloads.
 * Handles display-formatted values (commas, spaces, currency) that Number() rejects.
 */

/** Normalize Eastern Arabic / Persian digits and separators to ASCII. */
export function normalizeToEnglishDigits(value) {
  if (value == null) return value;
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

/**
 * Parse a money/amount value for validation and API payloads.
 * Handles numbers, digit strings, and display-formatted values (commas, spaces, currency).
 * Empty / non-numeric → 0. Numeric values (including negatives) are preserved as-is.
 */
export function parseAmount(value) {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const normalized = normalizeToEnglishDigits(value);
  const stripped = String(normalized).replace(/[^\d.]/g, "");
  if (!stripped) return 0;
  const n = parseFloat(stripped);
  return Number.isNaN(n) ? 0 : n;
}

/** True when the value represents a finite amount greater than zero. */
export function isPositiveAmount(value) {
  const n = parseAmount(value);
  return Number.isFinite(n) && n > 0;
}

/**
 * Parse a money input string into form state: "" when empty, otherwise a number.
 * Strips formatting (commas, spaces, currency) and non-digits.
 */
export function parseMoneyInput(value) {
  const englishValue = String(normalizeToEnglishDigits(value ?? "") ?? "");
  const rawValue = englishValue.replace(/\D/g, "");
  return rawValue === "" ? "" : Number(rawValue);
}

/**
 * Format a price for display: commas every 3 digits.
 * Accepts number or string; normalizes by stripping non-digits so display is correct.
 */
export function formatPrice(num) {
  if (num === "" || num === null || num === undefined) return "";
  const str =
    typeof num === "string"
      ? num.replace(/\D/g, "")
      : String(Math.floor(Number(num)));
  if (!str) return "";
  const n = parseInt(str, 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US");
}

/** Unit form price fields sent to the API only when positive. */
export const UNIT_PRICE_FIELDS = [
  "totalPrice",
  "downPayment",
  "paid_amount",
  "remaining_amount",
  "over_price",
  "monthlyRentPrice",
];

/**
 * Keep price fields only when they parse to a finite positive number.
 * null / empty / 0 / invalid → omitted from the payload (not sent as 0/null).
 */
export function sanitizePriceFields(data, fields = UNIT_PRICE_FIELDS) {
  const out = { ...data };
  for (const field of fields) {
    if (!(field in out)) continue;
    const raw = out[field];
    if (raw === "" || raw === null || raw === undefined) {
      delete out[field];
      continue;
    }
    const amount = parseAmount(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      delete out[field];
      continue;
    }
    out[field] = amount;
  }
  return out;
}
