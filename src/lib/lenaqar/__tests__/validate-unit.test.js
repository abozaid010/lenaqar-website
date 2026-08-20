/**
 * Unit tests for the LenAqar §18 gate and token allowlist.
 * Run with: node --test src/lib/lenaqar/__tests__/validate-unit.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { validateUnit, isListableOpportunity } from "../validate-unit.js";
import { matchesNetwork } from "../network-filter.js";
import { cashMultiple } from "../metrics.js";
import { SITE } from "../../../config/site.js";
import { computeExitComparison } from "../exit-comparison.js";
import { toPublicOpportunity } from "../to-public-opportunity.js";
import { opportunityToUnitFormPrefill } from "../opportunity-to-unit-form.js";

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

test("opportunity prefill maps listing fields and drops identity", () => {
  const prefill = opportunityToUnitFormPrefill({
    ...cleanTmgUnit,
    code: "6QKbijY9",
    unitId: "should-not-copy",
    unitTitle: "South Med 3BR",
    projectAr: "ساوث ميد",
    city: "New Cairo",
    roomsCount: 3,
    overPrice: 250000,
    remainingAmount: 1000000,
    images: [{ url: "https://example.com/a.jpg", fileId: "x" }],
  });
  assert.equal(prefill.purpose, "sell");
  assert.equal(prefill.project, "south med");
  assert.equal(prefill.project_ar, "ساوث ميد");
  assert.equal(prefill.unitTitle, "South Med 3BR");
  assert.equal(prefill.city, "New Cairo");
  assert.equal(prefill.roomsCount, 3);
  assert.equal(prefill.totalPrice, cleanTmgUnit.totalPrice);
  assert.equal(prefill.installment_years, 11);
  assert.equal(prefill.over_price, 250000);
  assert.equal(prefill.remaining_amount, 1000000);
  assert.equal(prefill.code, undefined);
  assert.equal(prefill.unitId, undefined);
  assert.equal(prefill.images[0].url, "https://example.com/a.jpg");
  assert.equal(prefill.images[0].fileId, undefined);
});

test("allowlist keeps overPrice and still drops cache_price", () => {
  const mapped = toPublicOpportunity({
    ...cleanTmgUnit,
    over_price: 150000,
    cache_price: 1,
  });
  assert.equal(mapped.overPrice, 150000);
  assert.equal(mapped.cache_price, undefined);
});

test("slim listing gate accepts a priced unit without downPayment", () => {
  assert.equal(
    isListableOpportunity({ code: "abc", totalPrice: 1_000_000 }),
    true
  );
  assert.equal(isListableOpportunity({ code: "abc", totalPrice: 0 }), false);
  assert.equal(isListableOpportunity({ totalPrice: 1_000_000 }), false);
});
