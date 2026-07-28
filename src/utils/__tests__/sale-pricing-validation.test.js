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
import { validateSalePricing } from "../sale-pricing-validation.js";

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
    result.fieldErrors.totalPrice.fallback,
    "Total price is required."
  );
});

test("installments: any one field requires all three", () => {
  const partial = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 200000,
    remaining_amount: "",
    installment_years: "",
  });
  assert.equal(partial.ok, false);
  assert.ok(partial.invalidFields.includes("remaining_amount"));
  assert.ok(partial.invalidFields.includes("installment_years"));
  assert.equal(partial.invalidFields.includes("downPayment"), false);

  const complete = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 200000,
    remaining_amount: 1800000,
    installment_years: 5,
  });
  assert.equal(complete.ok, true);
});

test("installments: invalid numbers are rejected without coercion", () => {
  const result = validateSalePricing({
    totalPrice: 2000000,
    downPayment: 0,
    remaining_amount: -100,
    installment_years: "abc",
  });
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors.downPayment.fallback, "Please enter a valid number.");
  assert.equal(result.fieldErrors.remaining_amount.fallback, "Please enter a valid number.");
  assert.equal(result.fieldErrors.installment_years.fallback, "Please enter a valid number.");
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
