/**
 * Run: node --test src/lib/lenaqar/__tests__/unit-display-guards.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCashMultiple } from "../metrics.js";
import { plausibleInstallmentYears } from "../unit-trust.js";
import { toPublicOpportunity } from "../to-public-opportunity.js";

describe("formatCashMultiple", () => {
  it("does not render Number(null) as 0.0", () => {
    assert.equal(formatCashMultiple(null), null);
    assert.equal(formatCashMultiple(undefined), null);
    assert.equal(formatCashMultiple(""), null);
    assert.equal(formatCashMultiple(0), null);
  });

  it("formats positive multiples", () => {
    assert.equal(formatCashMultiple(3.66), "3.7");
  });
});

describe("plausibleInstallmentYears", () => {
  it("accepts realistic whole years", () => {
    assert.equal(plausibleInstallmentYears(1), 1);
    assert.equal(plausibleInstallmentYears(11), 11);
    assert.equal(plausibleInstallmentYears(40), 40);
  });

  it("suppresses money-like or fractional CRM mistakes", () => {
    assert.equal(plausibleInstallmentYears(293000), null);
    assert.equal(plausibleInstallmentYears(0), null);
    assert.equal(plausibleInstallmentYears(41), null);
    assert.equal(plausibleInstallmentYears(11.5), null);
    assert.equal(plausibleInstallmentYears(null), null);
  });
});

describe("toPublicOpportunity installmentYears", () => {
  it("nulls absurd installment_years from CRM", () => {
    const unit = toPublicOpportunity({
      code: "LNk7qZIF",
      total_price: 7677290,
      installment_years: 293000,
      land_area: 107,
      delivery_date: "2029-01-01",
    });
    assert.equal(unit.installmentYears, null);
  });
});
