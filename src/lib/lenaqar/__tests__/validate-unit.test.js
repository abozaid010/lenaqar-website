/**
 * Unit tests for the LenAqar §18 gate and token allowlist.
 * Run with: node --test src/lib/lenaqar/__tests__/validate-unit.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { validateUnit } from "../validate-unit.js";
import { matchesNetwork } from "../network-filter.js";
import { cashMultiple } from "../metrics.js";
import { SITE } from "../../../config/site.js";
import { computeExitComparison } from "../exit-comparison.js";
import { toPublicOpportunity } from "../to-public-opportunity.js";

const network = SITE.network;

const cleanTmgUnit = {
  code: "6QKbijY9",
  developer: "Talaat Moustafa | TMG",
  project: "south med",
  totalPrice: 49052150,
  downPayment: 1422512.35,
  installmentYears: 11,
  installmentAmountYearly: 4329967.06,
  deliveryYear: 2029,
  isDelivered: false,
};

test("measured TMG unit passes the gate and the plan is within 2%", () => {
  const gate = validateUnit(cleanTmgUnit, new Date("2026-08-13"));
  assert.equal(gate.ok, true);
  const expected =
    cleanTmgUnit.downPayment +
    cleanTmgUnit.installmentAmountYearly * cleanTmgUnit.installmentYears;
  const drift =
    Math.abs(expected - cleanTmgUnit.totalPrice) / cleanTmgUnit.totalPrice;
  assert.ok(drift <= 0.02);
});

test("downPayment 0 fails the gate", () => {
  const gate = validateUnit({ ...cleanTmgUnit, downPayment: 0 });
  assert.equal(gate.ok, false);
  assert.equal(gate.reason, "downPayment_missing_or_not_positive");
});

test("empty developer fails the gate", () => {
  const gate = validateUnit({ ...cleanTmgUnit, developer: "", developerAr: "" });
  assert.equal(gate.ok, false);
  assert.equal(gate.reason, "developer_empty");
});

test("cash multiple of the measured unit is inside 1…40", () => {
  const multiple = cashMultiple(cleanTmgUnit.totalPrice, cleanTmgUnit.downPayment);
  assert.ok(multiple > 34 && multiple < 35);
  assert.ok(multiple <= SITE.cashMultipleBounds.max);
});

test("network allowlist matches TMG + south med on tokens", () => {
  assert.equal(matchesNetwork(cleanTmgUnit, network), true);
});

test("نور does not match inside نورث / north", () => {
  assert.equal(
    matchesNetwork(
      {
        developer: "Talaat Moustafa | TMG",
        project: "hyde park north",
      },
      network
    ),
    false
  );
  assert.equal(
    matchesNetwork(
      {
        developer: "Talaat Moustafa | TMG",
        project: "نورث",
      },
      network
    ),
    false
  );
});

test("worked example: 10M unit, 2M paid, 15% cancel penalty", () => {
  const result = computeExitComparison({
    unitPrice: 10_000_000,
    amountPaid: 2_000_000,
  });
  assert.equal(result.cancelPenalty, 1_500_000);
  assert.equal(result.cancelReceives, 500_000);
  assert.equal(result.sellThroughUs, 2_000_000);
});

test("allowlist mapper drops author and other internal fields", () => {
  const mapped = toPublicOpportunity({
    ...cleanTmgUnit,
    author: "ghada.hossam@lena.ai",
    notes: "internal",
    extra_info: "secret",
    visibility: "visible",
    dataSource: "crm",
    cache_price: 1,
    owner_mobile: "01000000000",
    owner_name: "hidden",
    images: [{ url: "https://example.com/a.jpg", fileId: "x" }],
  });
  assert.equal(mapped.author, undefined);
  assert.equal(mapped.notes, undefined);
  assert.equal(mapped.extra_info, undefined);
  assert.equal(mapped.owner_mobile, undefined);
  assert.equal(mapped.images[0].url, "https://example.com/a.jpg");
  assert.equal(mapped.images[0].fileId, undefined);
  assert.equal(mapped.code, cleanTmgUnit.code);
});
