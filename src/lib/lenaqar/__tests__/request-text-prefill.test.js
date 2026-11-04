/**
 * Homepage composer free-text prefill. Run with:
 * node --test src/lib/lenaqar/__tests__/request-text-prefill.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  prefillFromRequestText,
  validateRequestText,
  REQUEST_TEXT_MAX,
} from "../request-text-prefill.js";

const EXAMPLE =
  "عايز شقة تلت غرف ف القاهرة الجديدة تكون استلام فوري، معايا مقدم ٣ مليون وأقدر أقسّط ٥٠ ألف.. مهم تكون قريبة من الخدمات";

test("homepage example maps to an installment apartment request", () => {
  const out = prefillFromRequestText(EXAMPLE);
  assert.equal(out.buildingType, "apartment");
  assert.equal(out.roomsCount, 3);
  assert.equal(out.paymentMode, "installment");
  assert.equal(out.downPayment, 3_000_000);
  assert.equal(out.monthlyInstallment, 50_000);
  assert.equal(out.deliveryDate, "ready");
  assert.equal(out.notes, EXAMPLE);
});

test("cash budget with a half million", () => {
  const out = prefillFromRequestText("فيلا في مدينتي كاش ميزانيتي لحد 12 مليون ونص");
  assert.equal(out.buildingType, "villa");
  assert.equal(out.paymentMode, "cash");
  assert.equal(out.max_price, 12_500_000);
  assert.equal(out.downPayment, undefined);
});

test("digits before rooms word and English text", () => {
  const out = prefillFromRequestText(
    "Looking for a 2 bedroom apartment, down payment 1.5 million, monthly 40k",
  );
  assert.equal(out.buildingType, "apartment");
  assert.equal(out.roomsCount, 2);
  assert.equal(out.paymentMode, "installment");
  assert.equal(out.downPayment, 1_500_000);
  assert.equal(out.monthlyInstallment, 40_000);
});

test("earliest property type wins when several are mentioned", () => {
  const out = prefillFromRequestText("تاون هاوس أو فيلا في الشيخ زايد");
  assert.equal(out.buildingType, "townhouse");
});

test("rooms count is not mistaken for money", () => {
  const out = prefillFromRequestText("شقة 3 غرف في الشروق");
  assert.equal(out.roomsCount, 3);
  assert.equal(out.max_price, undefined);
  assert.equal(out.paymentMode, undefined);
});

test("nothing recognisable keeps only the notes", () => {
  const out = prefillFromRequestText("بدور على حاجة هادية قريبة من شغلي");
  assert.deepEqual(out, { notes: "بدور على حاجة هادية قريبة من شغلي" });
});

test("validation states", () => {
  assert.equal(validateRequestText("   "), "empty");
  assert.equal(validateRequestText("شقة"), "short");
  assert.equal(validateRequestText("x".repeat(REQUEST_TEXT_MAX + 1)), "long");
  assert.equal(validateRequestText(EXAMPLE), "");
});
