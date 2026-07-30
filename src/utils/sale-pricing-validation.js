import {
  classifyPositiveAmount,
  classifyPositiveInteger,
  isAmountEntered,
  parseAmount,
} from "./parse-amount.js";
import { UNIT_FORM_VALIDATION_KEYS as K } from "../constants/unit-form-validation-keys.js";

const INVALID_NUMBER = { key: K.invalidNumber };

/**
 * Default remaining when the user leaves it blank:
 * remaining = max(0, totalPrice − paid_amount).
 * Returns null when totalPrice is not a usable positive amount.
 */
export function computeRemainingFromPaid(totalPrice, paidAmount) {
  const total = parseAmount(totalPrice);
  if (!Number.isFinite(total) || total <= 0) return null;
  const paid = parseAmount(paidAmount);
  const remaining = total - (Number.isFinite(paid) ? paid : 0);
  return remaining > 0 ? remaining : 0;
}

/**
 * Helper math: downPayment = paid_amount + over_price.
 * Returns null unless both paid and over are entered and each is >= 0.
 */
export function computeDownPaymentFromPaidAndOver(paidAmount, overPrice) {
  if (!isAmountEntered(paidAmount) || !isAmountEntered(overPrice)) return null;
  const paid = parseAmount(paidAmount);
  const over = parseAmount(overPrice);
  if (!Number.isFinite(paid) || paid < 0) return null;
  if (!Number.isFinite(over) || over < 0) return null;
  return paid + over;
}

/**
 * True when downPayment matches paid + over (or when there is nothing to compare).
 * Used for a soft, non-blocking warning only.
 */
export function isDownPaymentMatchingPaidAndOver(
  downPayment,
  paidAmount,
  overPrice
) {
  const expected = computeDownPaymentFromPaidAndOver(paidAmount, overPrice);
  if (expected == null || !isAmountEntered(downPayment)) return true;
  return parseAmount(downPayment) === expected;
}

/**
 * Sale create/update API (`/units/v1/add-sale`, `/units/v1/update-sale`) requires
 * these amount keys on the body. Cash sales leave them blank in the UI; omitting
 * the key causes FastAPI validation errors such as:
 *   "body -> downPayment (missing): Field required"
 * Send 0 for unused cash fields (historical API contract).
 */
export const SALE_API_ZERO_DEFAULT_FIELDS = [
  "downPayment",
  "paid_amount",
  "remaining_amount",
  "over_price",
  "installment_years",
];

/**
 * Payment-plan fields that imply the unit may still be under construction / installment.
 * totalPrice alone is cash pricing and does not count (keeps delivered-unit default).
 */
export const SALE_PAYMENT_PLAN_FIELDS = [
  "downPayment",
  "paid_amount",
  "remaining_amount",
  "installment_years",
  "over_price",
];

/** YYYY-MM-DD one year before today (assumed delivered). */
export function getDefaultDeliveredDateIso(now = new Date()) {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
}

/** True when any installment / payment-plan field has a real positive value.
 * API cash units store 0 for unused fields — those must not count as a plan.
 */
export function hasSalePaymentPlanInfo(data = {}) {
  return SALE_PAYMENT_PLAN_FIELDS.some((field) => {
    if (field === "installment_years") {
      return classifyPositiveInteger(data[field]).status === "valid";
    }
    return classifyPositiveAmount(data[field]).status === "valid";
  });
}

/**
 * Ensure sale payloads include API-required amount keys (0 when unused / cash).
 * When a payment plan is present and remaining_amount is blank, fill
 * remaining = totalPrice − paid_amount before applying cash zeros.
 */
export function applySaleApiAmountDefaults(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.purpose !== "sell") return payload;

  const out = { ...payload };

  const remainingBlank =
    !("remaining_amount" in out) ||
    out.remaining_amount === "" ||
    out.remaining_amount == null;
  if (remainingBlank && hasSalePaymentPlanInfo(out)) {
    const computed = computeRemainingFromPaid(out.totalPrice, out.paid_amount);
    if (computed != null) {
      out.remaining_amount = computed;
    }
  }

  for (const field of SALE_API_ZERO_DEFAULT_FIELDS) {
    if (!(field in out) || out[field] === "" || out[field] == null) {
      out[field] = 0;
    }
  }
  return out;
}

/**
 * Validate sell-unit pricing before submit.
 * Returns i18n keys only — translate at the UI layer.
 */
export function validateSalePricing(data = {}) {
  const fieldErrors = {};

  const total = classifyPositiveAmount(data.totalPrice);
  if (total.status === "empty") {
    fieldErrors.totalPrice = { key: K.totalPriceRequired };
  } else if (total.status === "invalid") {
    fieldErrors.totalPrice = INVALID_NUMBER;
  }

  // Entering any installment field requires downPayment + years.
  // remaining_amount stays optional (auto-filled as totalPrice − paid when blank).
  const installmentTouched =
    isAmountEntered(data.downPayment) ||
    isAmountEntered(data.remaining_amount) ||
    isAmountEntered(data.installment_years);

  if (installmentTouched) {
    const down = classifyPositiveAmount(data.downPayment);
    if (down.status === "empty") {
      fieldErrors.downPayment = { key: K.downPaymentRequiredInstallments };
    } else if (down.status === "invalid") {
      fieldErrors.downPayment = INVALID_NUMBER;
    }

    // Optional: only reject when the user typed an invalid value.
    if (isAmountEntered(data.remaining_amount)) {
      const remaining = classifyPositiveAmount(data.remaining_amount);
      if (remaining.status === "invalid") {
        fieldErrors.remaining_amount = INVALID_NUMBER;
      }
    }

    const years = classifyPositiveInteger(data.installment_years);
    if (years.status === "empty") {
      fieldErrors.installment_years = {
        key: K.installmentYearsRequiredInstallments,
      };
    } else if (years.status === "invalid") {
      fieldErrors.installment_years = INVALID_NUMBER;
    }
  }

  const invalidFields = Object.keys(fieldErrors);
  return {
    ok: invalidFields.length === 0,
    invalidFields,
    fieldErrors,
  };
}
