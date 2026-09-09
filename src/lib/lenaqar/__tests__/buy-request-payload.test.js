/**
 * Public buy-request payload. Run with:
 * node --test src/lib/lenaqar/__tests__/buy-request-payload.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublicBuyRequirement,
  inferBuyRequestPaymentMode,
  parseMoney,
  toYearMonth,
} from "../buy-request-payload.js";

const sampleCashForm = {
  paymentMode: "cash",
  city: "cairo",
  district: "new cairo",
  buildingType: "apartment",
  roomsCount: 3,
  max_price: 3000000,
  downPayment: 300000,
  monthlyInstallment: 15000,
  notes: "عايز شقة قريبة من الخدمات",
  deliveryDate: "less_than_2_years",
  project: "Madinaty",
  client_id: "must-not-be-sent",
  totalPrice: 999,
  finishingType: "fully finished",
  overPrice: 100000,
};

const sampleInstallmentForm = {
  paymentMode: "installment",
  city: "cairo",
  district: "new cairo",
  buildingType: "apartment",
  roomsCount: 3,
  downPayment: 300000,
  monthlyInstallment: 15000,
  notes: "عايز شقة قريبة من الخدمات",
  deliveryDate: "less_than_2_years",
  project: "Madinaty",
};

test("parseMoney strips grouping characters", () => {
  assert.equal(parseMoney("3,000,000"), 3000000);
  assert.equal(parseMoney(""), null);
  assert.ok(Number.isNaN(parseMoney("abc")));
});

test("parseMoney converts Eastern Arabic digits", () => {
  assert.equal(parseMoney("٣٠٠٠٠٠٠"), 3000000);
  assert.equal(parseMoney("3٬000٬000"), 3000000);
});

test("toYearMonth keeps YYYY-MM and trims ISO dates", () => {
  assert.equal(toYearMonth("2026-12"), "2026-12");
  assert.equal(toYearMonth("2026-12-01T00:00:00Z"), "2026-12");
  assert.equal(toYearMonth("not-a-date"), "");
});

test("toYearMonth converts Eastern Arabic digits", () => {
  assert.equal(toYearMonth("٢٠٢٦-١٢"), "2026-12");
});

test("inferBuyRequestPaymentMode uses installment fields when present", () => {
  assert.equal(inferBuyRequestPaymentMode({}), "cash");
  assert.equal(
    inferBuyRequestPaymentMode({ downPayment: 100000 }),
    "installment",
  );
  assert.equal(
    inferBuyRequestPaymentMode({ paymentMode: "cash", downPayment: 1 }),
    "cash",
  );
});

test("cash mode sends max_price and forces ready delivery", () => {
  const result = buildPublicBuyRequirement(sampleCashForm);
  assert.equal(result.ok, true);
  assert.deepEqual(result.requirement, {
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    roomsCount: 3,
    max_price: 3000000,
    deliveryDate: "ready",
    project: "Madinaty",
    additionalFeatures: ["عايز شقة قريبة من الخدمات"],
  });
  assert.equal("downPayment" in result.requirement, false);
  assert.equal("monthlyInstallment" in result.requirement, false);
  assert.equal("client_id" in result.requirement, false);
  assert.equal("totalPrice" in result.requirement, false);
  assert.equal("finishingType" in result.requirement, false);
  assert.equal("overPrice" in result.requirement, false);
  assert.equal("notes" in result.requirement, false);
});

test("installment mode sends down payment fields and optional delivery", () => {
  const result = buildPublicBuyRequirement(sampleInstallmentForm);
  assert.equal(result.ok, true);
  assert.deepEqual(result.requirement, {
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    roomsCount: 3,
    downPayment: 300000,
    monthlyInstallment: 15000,
    deliveryDate: "less_than_2_years",
    project: "Madinaty",
    additionalFeatures: ["عايز شقة قريبة من الخدمات"],
  });
  assert.equal("max_price" in result.requirement, false);
});

test("installment mode allows empty delivery", () => {
  const result = buildPublicBuyRequirement({
    ...sampleInstallmentForm,
    deliveryDate: "",
  });
  assert.equal(result.ok, true);
  assert.equal("deliveryDate" in result.requirement, false);
});

test("defaults to cash when paymentMode is missing", () => {
  const result = buildPublicBuyRequirement({
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    max_price: "3000000",
    roomsCount: "",
    downPayment: "",
    monthlyInstallment: "",
    notes: "",
    deliveryDate: "",
    project: "",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.requirement, {
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    max_price: 3000000,
    deliveryDate: "ready",
  });
});

test("rejects missing required fields", () => {
  const result = buildPublicBuyRequirement({});
  assert.equal(result.ok, false);
  assert.equal(result.errors.city, "cityRequired");
  assert.equal(result.errors.district, "districtRequired");
  assert.equal(result.errors.buildingType, "buildingTypeRequired");
  assert.equal(result.errors.max_price, "maxPriceRequired");
});

test("rejects missing installment down payment", () => {
  const result = buildPublicBuyRequirement({
    paymentMode: "installment",
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.downPayment, "downPaymentRequired");
  assert.equal(result.errors.monthlyInstallment, undefined);
  assert.equal(result.errors.max_price, undefined);
});

test("installment mode allows down payment without monthly", () => {
  const result = buildPublicBuyRequirement({
    paymentMode: "installment",
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    downPayment: 400000,
  });
  assert.equal(result.ok, true);
  assert.equal(result.requirement.downPayment, 400000);
  assert.equal("monthlyInstallment" in result.requirement, false);
});

test("rejects a buildingType that is not in the enum", () => {
  const result = buildPublicBuyRequirement({
    ...sampleCashForm,
    buildingType: "spaceship",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.buildingType, "buildingTypeInvalid");
});

test("rejects invalid rooms, money, and deliveryDate", () => {
  const result = buildPublicBuyRequirement({
    ...sampleInstallmentForm,
    roomsCount: 2.5,
    downPayment: -1,
    deliveryDate: "December 2026",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.roomsCount, "invalidRooms");
  assert.equal(result.errors.downPayment, "invalidNumber");
  assert.equal(result.errors.deliveryDate, "invalidDeliveryDate");
});

test("rejects notes that are too long", () => {
  const result = buildPublicBuyRequirement({
    ...sampleCashForm,
    notes: "x".repeat(1001),
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.notes, "notesTooLong");
});

test("normalizes city/district case and delivery preference tokens", () => {
  const result = buildPublicBuyRequirement({
    ...sampleInstallmentForm,
    city: "Cairo",
    district: "New Cairo",
    deliveryDate: "immediate",
  });
  assert.equal(result.ok, true);
  assert.equal(result.requirement.city, "cairo");
  assert.equal(result.requirement.district, "new cairo");
  assert.equal(result.requirement.deliveryDate, "ready");
});

test("converts Arabic digits in money and rooms before API payload", () => {
  const result = buildPublicBuyRequirement({
    ...sampleInstallmentForm,
    roomsCount: "٣",
    downPayment: "٣٠٠٠٠٠",
    monthlyInstallment: "١٥٠٠٠",
    deliveryDate: "less_than_1_year",
  });
  assert.equal(result.ok, true);
  assert.equal(result.requirement.roomsCount, 3);
  assert.equal(result.requirement.downPayment, 300000);
  assert.equal(result.requirement.monthlyInstallment, 15000);
  assert.equal(result.requirement.deliveryDate, "less_than_1_year");
});
