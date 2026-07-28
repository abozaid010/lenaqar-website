import {
  classifyPositiveAmount,
  classifyPositiveInteger,
  isAmountEntered,
} from "./parse-amount.js";

const INVALID_NUMBER = {
  key: "saleDetails.invalidNumber",
  fallback: "Please enter a valid number.",
};

/**
 * Validate sell-unit pricing before submit.
 * Cash: only totalPrice required; installment fields must stay empty.
 * Installments: if any of downPayment / remaining_amount / installment_years
 * is entered, all three are required and must be valid positive numbers.
 */
export function validateSalePricing(data = {}) {
  const fieldErrors = {};

  const total = classifyPositiveAmount(data.totalPrice);
  if (total.status === "empty") {
    fieldErrors.totalPrice = {
      key: "saleDetails.totalPriceRequired",
      fallback: "Total price is required.",
    };
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
      fieldErrors.downPayment = {
        key: "saleDetails.downPaymentRequiredInstallments",
        fallback: "Down payment is required when using installments.",
      };
    } else if (down.status === "invalid") {
      fieldErrors.downPayment = INVALID_NUMBER;
    }

    const remaining = classifyPositiveAmount(data.remaining_amount);
    if (remaining.status === "empty") {
      fieldErrors.remaining_amount = {
        key: "saleDetails.remainingAmountRequiredInstallments",
        fallback: "Remaining amount is required when using installments.",
      };
    } else if (remaining.status === "invalid") {
      fieldErrors.remaining_amount = INVALID_NUMBER;
    }

    const years = classifyPositiveInteger(data.installment_years);
    if (years.status === "empty") {
      fieldErrors.installment_years = {
        key: "saleDetails.installmentYearsRequiredInstallments",
        fallback: "Installment years is required when using installments.",
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
