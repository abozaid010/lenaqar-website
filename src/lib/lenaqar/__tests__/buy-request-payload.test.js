/**
 * Public buy-request payload. Run with:
 * node --test src/lib/lenaqar/__tests__/buy-request-payload.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPublicBuyRequirement,
  parseMoney,
  toYearMonth,
} from "../buy-request-payload.js";

const sampleForm = {
  city: "cairo",
  district: "new cairo",
  buildingType: "apartment",
  roomsCount: 3,
  max_price: 3000000,
  downPayment: 300000,
  monthlyInstallment: 15000,
  overPrice: 100000,
  deliveryDate: "2026-12",
  project: "Madinaty",
  client_id: "must-not-be-sent",
  totalPrice: 999,
  finishingType: "fully finished",
};

test("parseMoney strips grouping characters", () => {
  assert.equal(parseMoney("3,000,000"), 3000000);
  assert.equal(parseMoney(""), null);
  assert.ok(Number.isNaN(parseMoney("abc")));
});

test("toYearMonth keeps YYYY-MM and trims ISO dates", () => {
  assert.equal(toYearMonth("2026-12"), "2026-12");
  assert.equal(toYearMonth("2026-12-01T00:00:00Z"), "2026-12");
  assert.equal(toYearMonth("not-a-date"), "");
});

test("builds the documented API requirement and drops extra keys", () => {
  const result = buildPublicBuyRequirement(sampleForm);
  assert.equal(result.ok, true);
  assert.deepEqual(result.requirement, {
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    roomsCount: 3,
    max_price: 3000000,
    downPayment: 300000,
    monthlyInstallment: 15000,
    overPrice: 100000,
    deliveryDate: "2026-12",
    project: "Madinaty",
  });
  assert.equal("client_id" in result.requirement, false);
  assert.equal("totalPrice" in result.requirement, false);
  assert.equal("finishingType" in result.requirement, false);
});

test("omits empty optional fields instead of sending null", () => {
  const result = buildPublicBuyRequirement({
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    max_price: "3000000",
    roomsCount: "",
    downPayment: "",
    monthlyInstallment: "",
    overPrice: "",
    deliveryDate: "",
    project: "",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.requirement, {
    city: "cairo",
    district: "new cairo",
    buildingType: "apartment",
    max_price: 3000000,
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

test("rejects a buildingType that is not in the enum", () => {
  const result = buildPublicBuyRequirement({
    ...sampleForm,
    buildingType: "spaceship",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.buildingType, "buildingTypeInvalid");
});

test("rejects invalid rooms, money, and deliveryDate", () => {
  const result = buildPublicBuyRequirement({
    ...sampleForm,
    roomsCount: 2.5,
    overPrice: -1,
    deliveryDate: "December 2026",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.roomsCount, "invalidRooms");
  assert.equal(result.errors.overPrice, "invalidNumber");
  assert.equal(result.errors.deliveryDate, "invalidDeliveryDate");
});

test("normalizes city/district case and ISO deliveryDate", () => {
  const result = buildPublicBuyRequirement({
    ...sampleForm,
    city: "Cairo",
    district: "New Cairo",
    deliveryDate: "2026-12-15",
  });
  assert.equal(result.ok, true);
  assert.equal(result.requirement.city, "cairo");
  assert.equal(result.requirement.district, "new cairo");
  assert.equal(result.requirement.deliveryDate, "2026-12");
});
