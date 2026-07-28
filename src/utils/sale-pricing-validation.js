import {
  classifyPositiveAmount,
  classifyPositiveInteger,
  isAmountEntered,
} from "./parse-amount.js";
import { UNIT_FORM_VALIDATION_KEYS as K } from "../constants/unit-form-validation-keys.js";

const INVALID_NUMBER = { key: K.invalidNumber };

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
 */
export function applySaleApiAmountDefaults(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.purpose !== "sell") return payload;

  const out = { ...payload };
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

    const remaining = classifyPositiveAmount(data.remaining_amount);
    if (remaining.status === "empty") {
      fieldErrors.remaining_amount = {
        key: K.remainingAmountRequiredInstallments,
      };
    } else if (remaining.status === "invalid") {
      fieldErrors.remaining_amount = INVALID_NUMBER;
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
