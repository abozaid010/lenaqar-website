/**
 * Run: node --test src/lib/lenaqar/__tests__/unit-display-guards.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCashMultiple } from "../metrics.js";
import {
  mayShowMoneySplit,
  plausibleInstallmentYears,
} from "../unit-trust.js";
import { toPublicOpportunity } from "../to-public-opportunity.js";
import { buildListingSchema } from "../listing-seo.js";

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
    assert.equal(plausibleInstallmentYears(""), null);
    assert.equal(plausibleInstallmentYears(undefined), null);
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

describe("toPublicOpportunity money-split redaction (LNk7qZIF)", () => {
  it("strips inconsistent down/remaining/over from public payload", () => {
    // down+remaining = 8_320_000; total+over = 8_127_290 → inconsistent
    const unit = toPublicOpportunity({
      code: "LNk7qZIF",
      total_price: 7677290,
      down_payment: 2100000,
      remaining_amount: 6220000,
      over_price: 450000,
      paid_amount: 1650000,
      installment_years: 293000,
      installment_amount_yearly: 500000,
      land_area: 107,
      delivery_date: "2029-01-01",
    });
    assert.equal(unit.paymentSplitHidden, true);
    assert.equal(mayShowMoneySplit(unit), false);
    assert.equal(unit.downPayment, null);
    assert.equal(unit.remainingAmount, null);
    assert.equal(unit.overPrice, null);
    assert.equal(unit.installmentAmountYearly, null);
    assert.equal(unit.installmentYears, null);
    assert.equal(unit.totalPrice, 7677290);
  });

  it("nulls plausible installmentYears when the split is hidden (MguPxCF0)", () => {
    // Plausible years alone must not survive redaction in RSC/HTML/JSON-LD.
    const unit = toPublicOpportunity({
      code: "MguPxCF0",
      total_price: 7526640,
      down_payment: 2100000,
      remaining_amount: 6220000,
      over_price: 450000,
      installment_years: 10,
      installment_amount_yearly: 500000,
      land_area: 107,
      delivery_date: "2025-01-01",
    });
    assert.equal(unit.paymentSplitHidden, true);
    assert.equal(mayShowMoneySplit(unit), false);
    assert.equal(unit.downPayment, null);
    assert.equal(unit.remainingAmount, null);
    assert.equal(unit.installmentAmountYearly, null);
    assert.equal(unit.installmentYears, null);
    assert.equal(unit.totalPrice, 7526640);
    const schema = buildListingSchema(
      unit,
      "https://www.lenaqar.com/opportunities/MguPxCF0"
    );
    const props = schema.mainEntity.additionalProperty || [];
    assert.equal(
      props.some((p) => p.name === "مدة التقسيط"),
      false
    );
    assert.equal(
      props.some((p) => p.name === "المتبقي" || p.name === "الكاش المطلوب دلوقتي"),
      false
    );
  });

  it("keeps a consistent split including over/أوفر (kBqU7H1A-shaped)", () => {
    // down+remaining = total+over; mirrors valid kBqU7H1A plan years
    const unit = toPublicOpportunity({
      code: "kBqU7H1A",
      total_price: 6250000,
      down_payment: 312000,
      remaining_amount: 5938000,
      over_price: 0,
      installment_years: 9,
      installment_amount_yearly: 659777.78,
      land_area: 75,
      delivery_date: "2029-01-01",
    });
    assert.equal(unit.paymentSplitHidden, undefined);
    assert.equal(mayShowMoneySplit(unit), true);
    assert.equal(unit.downPayment, 312000);
    assert.equal(unit.remainingAmount, 5938000);
    assert.equal(unit.overPrice, 0);
    assert.equal(unit.installmentYears, 9);
    assert.equal(unit.installmentAmountYearly, 659777.78);
    const schema = buildListingSchema(
      unit,
      "https://www.lenaqar.com/opportunities/kBqU7H1A"
    );
    const yearsProp = (schema.mainEntity.additionalProperty || []).find(
      (p) => p.name === "مدة التقسيط"
    );
    assert.equal(yearsProp?.value, 9);
  });

  it("keeps a consistent split including over/أوفر", () => {
    // down+remaining = total+over
    const unit = toPublicOpportunity({
      code: "OKUNIT01",
      total_price: 1000000,
      down_payment: 300000,
      remaining_amount: 800000,
      over_price: 100000,
      installment_years: 8,
      installment_amount_yearly: 87500,
      land_area: 100,
      delivery_date: "2028-01-01",
    });
    assert.equal(unit.paymentSplitHidden, undefined);
    assert.equal(mayShowMoneySplit(unit), true);
    assert.equal(unit.downPayment, 300000);
    assert.equal(unit.remainingAmount, 800000);
    assert.equal(unit.overPrice, 100000);
    assert.equal(unit.installmentYears, 8);
  });
});
