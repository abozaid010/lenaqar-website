/**
 * Regression tests for totalPrice money parsing / validation.
 * Bug: comma-formatted display values (e.g. "5,300,000") failed Number() checks.
 * Run with: node --test src/utils/__tests__/total-price-validation.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  formatPrice,
  isPositiveAmount,
  parseAmount,
  parseMoneyInput,
} from "../parse-amount.js";

test("parseAmount accepts plain positive numbers and digit strings", () => {
  assert.equal(parseAmount(1), 1);
  assert.equal(parseAmount(1000), 1000);
  assert.equal(parseAmount(2500000), 2500000);
  assert.equal(parseAmount(10000000), 10000000);
  assert.equal(parseAmount("1"), 1);
  assert.equal(parseAmount("1000"), 1000);
  assert.equal(parseAmount("2500000"), 2500000);
  assert.equal(parseAmount("10000000"), 10000000);
});

test("parseAmount accepts comma/space/currency formatted display values", () => {
  assert.equal(parseAmount("5,300,000"), 5300000);
  assert.equal(parseAmount("1,000"), 1000);
  assert.equal(parseAmount("10,000,000"), 10000000);
  assert.equal(parseAmount("5 300 000"), 5300000);
  assert.equal(parseAmount("EGP 5,300,000"), 5300000);
  assert.equal(parseAmount("5,300,000 EGP"), 5300000);
});

test("parseAmount rejects empty / non-numeric / zero as non-positive via isPositiveAmount", () => {
  assert.equal(parseAmount(""), 0);
  assert.equal(parseAmount(null), 0);
  assert.equal(parseAmount(undefined), 0);
  assert.equal(parseAmount("abc"), 0);
  assert.equal(parseAmount("—"), 0);
  assert.equal(parseAmount(0), 0);
  assert.equal(parseAmount("0"), 0);
  assert.equal(parseAmount("0,000"), 0);

  assert.equal(isPositiveAmount(""), false);
  assert.equal(isPositiveAmount(null), false);
  assert.equal(isPositiveAmount(undefined), false);
  assert.equal(isPositiveAmount("abc"), false);
  assert.equal(isPositiveAmount(0), false);
  assert.equal(isPositiveAmount("0"), false);
  assert.equal(isPositiveAmount(-100), false);
  assert.equal(isPositiveAmount(NaN), false);
});

test("isPositiveAmount accepts valid positive totals including formatted ones", () => {
  for (const value of [
    1,
    1000,
    2500000,
    10000000,
    "1",
    "1000",
    "5,300,000",
    "10,000,000",
    "EGP 2,500,000",
  ]) {
    assert.equal(isPositiveAmount(value), true, `expected positive: ${value}`);
  }
});

test("Number() coercion (old bug) fails on formatted prices; parseAmount does not", () => {
  const formatted = "5,300,000";
  assert.equal(Number.isNaN(Number(formatted)), true);
  assert.equal(Number(formatted) > 0, false);
  assert.equal(isPositiveAmount(formatted), true);
  assert.equal(parseAmount(formatted), 5300000);
});

test("parseMoneyInput stores numeric form state from formatted input", () => {
  assert.equal(parseMoneyInput("5,300,000"), 5300000);
  assert.equal(parseMoneyInput("1,000"), 1000);
  assert.equal(parseMoneyInput("EGP 2500000"), 2500000);
  assert.equal(parseMoneyInput(""), "");
  assert.equal(parseMoneyInput("abc"), "");
  assert.equal(parseMoneyInput("0"), 0);
});

test("formatPrice → parseMoneyInput round-trip keeps positive amounts valid", () => {
  for (const n of [1, 1000, 5300000, 10000000, 2500000]) {
    const displayed = formatPrice(n);
    const stored = parseMoneyInput(displayed);
    assert.equal(stored, n);
    assert.equal(isPositiveAmount(stored), true);
    // Even if a bug reintroduced storing the display string:
    assert.equal(isPositiveAmount(displayed), true);
  }
});

test("Arabic-Indic digits are parsed correctly", () => {
  assert.equal(parseAmount("٥٬٣٠٠٬٠٠٠"), 5300000);
  assert.equal(parseMoneyInput("٥٣٠٠٠٠٠"), 5300000);
  assert.equal(isPositiveAmount("١٠٠٠"), true);
});
