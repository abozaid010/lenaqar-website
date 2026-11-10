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
  max_price: 3000000,
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
    purpose: "buy",
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
    purpose: "buy",
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    roomsCount: 3,
    max_price: 3000000,
    downPayment: 300000,
    monthlyInstallment: 15000,
    deliveryDate: "less_than_2_years",
    project: "Madinaty",
    additionalFeatures: ["عايز شقة قريبة من الخدمات"],
  });
  assert.equal(result.requirement.max_price, 3000000);
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
    purpose: "buy",
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
  assert.equal(result.errors.max_price, "maxPriceRequired");
});

test("installment mode allows down payment without monthly", () => {
  const result = buildPublicBuyRequirement({
    paymentMode: "installment",
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    max_price: 3000000,
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

import { formFromBuiltRequirement } from "../buy-request-payload.js";

const INSTALLMENT_FORM = {
  paymentMode: "installment",
  city: "new cairo",
  district: "fifth settlement",
  buildingType: "apartment",
  roomsCount: "3",
  downPayment: "3,000,000",
  monthlyInstallment: "50,000",
  max_price: "5000000",
  deliveryDate: "ready",
  notes: "شقة تلت غرف، استلام فوري",
};

test("server re-validation preserves installment budget and down payment", () => {
  const client = buildPublicBuyRequirement(INSTALLMENT_FORM);
  assert.equal(client.ok, true);
  const server = buildPublicBuyRequirement(formFromBuiltRequirement(client.requirement));
  assert.equal(server.ok, true);
  assert.deepEqual(server.requirement, client.requirement);
});

test("server re-validation keeps the notes (additionalFeatures)", () => {
  const client = buildPublicBuyRequirement({
    ...INSTALLMENT_FORM,
    paymentMode: "cash",
    max_price: "5000000",
  });
  const server = buildPublicBuyRequirement(formFromBuiltRequirement(client.requirement));
  assert.equal(server.ok, true);
  assert.deepEqual(server.requirement.additionalFeatures, ["شقة تلت غرف، استلام فوري"]);
  assert.deepEqual(server.requirement, client.requirement);
});

test("formFromBuiltRequirement tolerates empty input", () => {
  assert.deepEqual(formFromBuiltRequirement(null), {});
  assert.equal(formFromBuiltRequirement({ max_price: 1 }).paymentMode, "cash");
});

import { normalizeLoadedBuyRequest } from "../buy-request-payload.js";

// Shape returned by GET /public/v1/buy-request/{user_id} (live API, Nov 4).
const LOADED = {
  monthlyInstallment: 50000,
  downPayment: 3000000,
  deliveryDate: "ready",
  roomsCount: 3,
  max_price: null,
  additionalFeatures: ["شقة تلت غرف"],
  preferred_locations: [
    { district: null, city: "cairo", sub_district: null, project: null },
    { district: "fifth settlement", city: "new cairo", sub_district: null, project: null },
  ],
  preferred_property_types: ["apartment"],
};

test("saved request: newest location with a district fills city/district", () => {
  const out = normalizeLoadedBuyRequest(LOADED);
  assert.equal(out.city, "new cairo");
  assert.equal(out.district, "fifth settlement");
  assert.equal(out.sub_district, "");
  assert.equal(out.buildingType, "apartment");
  assert.equal(inferBuyRequestPaymentMode(out), "installment");
});

test("saved request: falls back to the last city-only location", () => {
  const out = normalizeLoadedBuyRequest({
    preferred_locations: [{ city: "cairo", district: null }],
  });
  assert.equal(out.city, "cairo");
  assert.equal(out.district, "");
});

test("saved request: flat fields from the API still win", () => {
  const out = normalizeLoadedBuyRequest({
    ...LOADED,
    city: "madinaty",
    district: "b1",
    buildingType: "villa",
  });
  assert.equal(out.city, "madinaty");
  assert.equal(out.district, "b1");
  assert.equal(out.buildingType, "villa");
});

test("saved request: tolerates missing/odd shapes", () => {
  assert.equal(normalizeLoadedBuyRequest(null), null);
  const out = normalizeLoadedBuyRequest({ preferred_locations: [null, {}], preferred_property_types: [""] });
  assert.equal(out.city, undefined);
  assert.equal(out.buildingType, undefined);
});

for (const value of ["", null, undefined, 0, -1, "invalid"]) {
  test(`installment budget rejects ${String(value)}`, () => {
    const result = buildPublicBuyRequirement({ ...sampleInstallmentForm, max_price: value });
    assert.equal(result.ok, false);
    assert.ok(result.errors.max_price);
  });
}

test("buyer purpose overrides caller input through server re-validation", () => {
  const client = buildPublicBuyRequirement({ ...sampleInstallmentForm, purpose: "rent" });
  assert.equal(client.ok, true);
  assert.equal(client.requirement.purpose, "buy");
  const server = buildPublicBuyRequirement(formFromBuiltRequirement({
    ...client.requirement,
    purpose: "sell",
  }));
  assert.equal(server.ok, true);
  assert.equal(server.requirement.purpose, "buy");
  assert.equal(server.requirement.max_price, 3000000);
  assert.equal(server.requirement.downPayment, 300000);
});
