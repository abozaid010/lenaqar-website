/**
 * Sale pricing validation: cash vs installment all-or-nothing.
 * Run with: node --test src/utils/__tests__/sale-pricing-validation.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyPositiveAmount,
  classifyPositiveInteger,
  isAmountEntered,
  sanitizePriceFields,
} from "../parse-amount.js";
import {
  applySaleApiAmountDefaults,
  computeDownPaymentFromPaidAndOver,
  computeRemainingFromPaid,
  getDefaultDeliveredDateIso,
  hasSalePaymentPlanInfo,
  isDownPaymentMatchingPaidAndOver,
  validateSalePricing,
} from "../sale-pricing-validation.js";

test("isAmountEntered treats blank as empty and 0 as entered", () => {
  assert.equal(isAmountEntered(""), false);
  assert.equal(isAmountEntered(null), false);
  assert.equal(isAmountEntered(undefined), false);
  assert.equal(isAmountEntered("  "), false);
  assert.equal(isAmountEntered(0), true);
  assert.equal(isAmountEntered("0"), true);
  assert.equal(isAmountEntered(100), true);
});

test("classifyPositiveAmount distinguishes empty / invalid / valid", () => {
  assert.equal(classifyPositiveAmount("").status, "empty");
  assert.equal(classifyPositiveAmount(null).status, "empty");
  assert.equal(classifyPositiveAmount(0).status, "invalid");
  assert.equal(classifyPositiveAmount(-5).status, "invalid");
  assert.equal(classifyPositiveAmount("abc").status, "invalid");
  assert.deepEqual(classifyPositiveAmount(1500000), {
    status: "valid",
    value: 1500000,
  });
  assert.deepEqual(classifyPositiveAmount("1,500,000"), {
    status: "valid",
    value: 1500000,
  });
});

test("classifyPositiveInteger rejects decimals and non-positive", () => {
  assert.equal(classifyPositiveInteger("").status, "empty");
  assert.equal(classifyPositiveInteger(0).status, "invalid");
  assert.equal(classifyPositiveInteger(1.5).status, "invalid");
  assert.equal(classifyPositiveInteger("3.5").status, "invalid");
  assert.equal(classifyPositiveInteger("abc").status, "invalid");
  assert.deepEqual(classifyPositiveInteger(5), { status: "valid", value: 5 });
  assert.deepEqual(classifyPositiveInteger("10"), { status: "valid", value: 10 });
});

test("cash sale: only totalPrice required", () => {
  const result = validateSalePricing({
    totalPrice: 2000000,
    downPayment: "",
    remaining_amount: "",
    installment_years: "",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.invalidFields, []);
});

test("cash sale: missing totalPrice fails", () => {
  const result = validateSalePricing({
    totalPrice: "",
    downPayment: "",
    remaining_amount: "",
    installment_years: "",
  });
  assert.equal(result.ok, false);
  assert.ok(result.invalidFields.includes("totalPrice"));
  assert.equal(
    result.fieldErrors.totalPrice.key,
    "unitFormValidation.totalPriceRequired"
  );
});

test("installments: downPayment requires years; remaining stays optional", () => {
  const partial = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 200000,
    remaining_amount: "",
    installment_years: "",
  });
  assert.equal(partial.ok, false);
  assert.equal(partial.invalidFields.includes("remaining_amount"), false);
  assert.ok(partial.invalidFields.includes("installment_years"));
  assert.equal(partial.invalidFields.includes("downPayment"), false);

  const withoutRemaining = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 200000,
    remaining_amount: "",
    installment_years: 5,
  });
  assert.equal(withoutRemaining.ok, true);

  const complete = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 200000,
    remaining_amount: 1800000,
    installment_years: 5,
  });
  assert.equal(complete.ok, true);
});

test("computeRemainingFromPaid is totalPrice − paid_amount", () => {
  assert.equal(computeRemainingFromPaid(2000000, 200000), 1800000);
  assert.equal(computeRemainingFromPaid("2,000,000", "200,000"), 1800000);
  assert.equal(computeRemainingFromPaid(2000000, ""), 2000000);
  assert.equal(computeRemainingFromPaid(2000000, 2000000), 0);
  assert.equal(computeRemainingFromPaid(2000000, 2500000), 0);
  assert.equal(computeRemainingFromPaid("", 200000), null);
});

test("installments: invalid numbers are rejected without coercion", () => {
  const result = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 0,
    remaining_amount: -100,
    installment_years: "abc",
  });
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors.downPayment.key, "unitFormValidation.invalidNumber");
  assert.equal(result.fieldErrors.remaining_amount.key, "unitFormValidation.invalidNumber");
  assert.equal(result.fieldErrors.installment_years.key, "unitFormValidation.invalidNumber");
});

test("sanitizePriceFields omits blank installment money fields", () => {
  const payload = sanitizePriceFields({
    totalPrice: 2000000,
    downPayment: "",
    remaining_amount: "",
    paid_amount: "",
    over_price: "",
  });
  assert.equal(payload.totalPrice, 2000000);
  assert.equal("downPayment" in payload, false);
  assert.equal("remaining_amount" in payload, false);
  assert.equal("paid_amount" in payload, false);
  assert.equal("over_price" in payload, false);
});

test("applySaleApiAmountDefaults restores API-required cash zeros", () => {
  const sanitized = sanitizePriceFields({
    purpose: "sell",
    totalPrice: 2000000,
    downPayment: "",
    remaining_amount: "",
    paid_amount: "",
    over_price: "",
  });
  const payload = applySaleApiAmountDefaults(sanitized);

  assert.equal(payload.totalPrice, 2000000);
  assert.equal(payload.downPayment, 0);
  assert.equal(payload.remaining_amount, 0);
  assert.equal(payload.paid_amount, 0);
  assert.equal(payload.over_price, 0);
  assert.equal(payload.installment_years, 0);
});

test("applySaleApiAmountDefaults keeps positive installment values", () => {
  const payload = applySaleApiAmountDefaults({
    purpose: "sell",
    totalPrice: 2000000,
    downPayment: 200000,
    remaining_amount: 1800000,
    installment_years: 5,
  });
  assert.equal(payload.downPayment, 200000);
  assert.equal(payload.remaining_amount, 1800000);
  assert.equal(payload.installment_years, 5);
  assert.equal(payload.paid_amount, 0);
  assert.equal(payload.over_price, 0);
});

test("applySaleApiAmountDefaults fills blank remaining from total − paid", () => {
  const payload = applySaleApiAmountDefaults({
    purpose: "sell",
    totalPrice: 2000000,
    downPayment: 200000,
    paid_amount: 300000,
    remaining_amount: "",
    installment_years: 5,
  });
  assert.equal(payload.remaining_amount, 1700000);
});

test("applySaleApiAmountDefaults does not alter rent payloads", () => {
  const payload = applySaleApiAmountDefaults({
    purpose: "rent",
    monthlyRentPrice: 15000,
  });
  assert.equal("downPayment" in payload, false);
  assert.equal(payload.monthlyRentPrice, 15000);
});

test("getDefaultDeliveredDateIso is one year before today", () => {
  const fixed = new Date("2026-07-28T12:00:00.000Z");
  assert.equal(getDefaultDeliveredDateIso(fixed), "2025-07-28");
});

test("hasSalePaymentPlanInfo ignores totalPrice-only cash", () => {
  assert.equal(
    hasSalePaymentPlanInfo({
      totalPrice: 2000000,
      downPayment: "",
      paid_amount: "",
      remaining_amount: "",
      installment_years: "",
      over_price: "",
    }),
    false
  );
  assert.equal(
    hasSalePaymentPlanInfo({
      totalPrice: 2000000,
      downPayment: 0,
      remaining_amount: 0,
      installment_years: 0,
    }),
    false
  );
  assert.equal(
    hasSalePaymentPlanInfo({
      totalPrice: 2000000,
      downPayment: 100000,
    }),
    true
  );
  assert.equal(
    hasSalePaymentPlanInfo({
      installment_years: 5,
    }),
    true
  );
});

test("computeDownPaymentFromPaidAndOver sums entered non-negative amounts", () => {
  assert.equal(computeDownPaymentFromPaidAndOver("", 100), null);
  assert.equal(computeDownPaymentFromPaidAndOver(100, ""), null);
  assert.equal(computeDownPaymentFromPaidAndOver(100000, 50000), 150000);
  assert.equal(computeDownPaymentFromPaidAndOver(0, 0), 0);
  assert.equal(computeDownPaymentFromPaidAndOver("1,000", "500"), 1500);
});

test("isDownPaymentMatchingPaidAndOver soft-checks equation", () => {
  assert.equal(isDownPaymentMatchingPaidAndOver("", 100, 50), true);
  assert.equal(isDownPaymentMatchingPaidAndOver(150, 100, 50), true);
  assert.equal(isDownPaymentMatchingPaidAndOver(200, 100, 50), false);
  assert.equal(isDownPaymentMatchingPaidAndOver(100, 100, ""), true);
});
