/**
 * Unit tests for the public sell-form → SalePropertyDetails payload builder.
 * Run with: node --test src/lib/lenaqar/__tests__/sale-unit-payload.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildSaleUnitPayload } from "../sale-unit-payload.js";
import { SITE } from "../../../config/site.js";

const validForm = {
  ownerName: "Ahmed",
  ownerPhone: "+201012345678",
  developer: "Talaat Moustafa",
  buildingType: "apartment",
  city: "cairo",
  district: "new cairo",
  subDistrict: "madinaty",
  landArea: "120",
  totalPrice: "2000000",
  paidAmount: "500000",
};

test("includes clientId/dataSource so backend Pydantic validation never 422s on a missing-field error", () => {
  const payload = buildSaleUnitPayload(validForm);
  assert.equal(payload.clientId, SITE.clientId);
  assert.equal(payload.dataSource, "website");
});

test("never sends visibility, author, or presentValue — nothing for a forged client to override", () => {
  const payload = buildSaleUnitPayload(validForm);
  assert.equal("visibility" in payload, false);
  assert.equal("author" in payload, false);
  assert.equal("presentValue" in payload, false);
});

test("purpose is always sell, regardless of input", () => {
  const payload = buildSaleUnitPayload({ ...validForm, purpose: "rent" });
  assert.equal(payload.purpose, "sell");
});

test("paidAmount maps to both downPayment and paid_amount", () => {
  const payload = buildSaleUnitPayload(validForm);
  assert.equal(payload.downPayment, 500000);
  assert.equal(payload.paid_amount, 500000);
});

test("numeric fields coerce non-numeric/empty input to 0 rather than NaN", () => {
  const payload = buildSaleUnitPayload({
    ...validForm,
    landArea: "",
    totalPrice: "abc",
    paidAmount: undefined,
  });
  assert.equal(payload.landArea, 0);
  assert.equal(payload.totalPrice, 0);
  assert.equal(payload.downPayment, 0);
  assert.equal(payload.paid_amount, 0);
});

test("formatted display prices parse to full amounts, not Number('20,000,000') === 20", () => {
  const payload = buildSaleUnitPayload({
    ...validForm,
    totalPrice: "20,000,000",
    paidAmount: "1,500,000",
  });
  assert.equal(payload.totalPrice, 20000000);
  assert.equal(payload.paid_amount, 1500000);
  assert.equal(payload.downPayment, 1500000);
});

test("converts Eastern Arabic digits in landArea and money fields", () => {
  const payload = buildSaleUnitPayload({
    ...validForm,
    landArea: "١٢٠",
    totalPrice: "٢٠٠٠٠٠٠",
    paidAmount: "٥٠٠٠٠٠",
  });
  assert.equal(payload.landArea, 120);
  assert.equal(payload.totalPrice, 2000000);
  assert.equal(payload.paid_amount, 500000);
  assert.equal(payload.downPayment, 500000);
});

test("empty developer and project are omitted, not sent as empty strings", () => {
  const payload = buildSaleUnitPayload({ ...validForm, developer: "  ", project: "" });
  assert.equal(payload.developer, undefined);
  assert.equal(payload.project, undefined);
});

test("project name passes through when provided", () => {
  const payload = buildSaleUnitPayload({ ...validForm, project: "  Madinaty  " });
  assert.equal(payload.project, "Madinaty");
});

test("empty owner_name/owner_mobile are omitted, not sent as empty strings", () => {
  const payload = buildSaleUnitPayload({ ...validForm, ownerName: "", ownerPhone: "" });
  assert.equal(payload.owner_name, undefined);
  assert.equal(payload.owner_mobile, undefined);
});

test("images is always an empty array — public form never collects images", () => {
  const payload = buildSaleUnitPayload(validForm);
  assert.deepEqual(payload.images, []);
});

test("location fields pass through when provided", () => {
  const payload = buildSaleUnitPayload(validForm);
  assert.equal(payload.city, "cairo");
  assert.equal(payload.district, "new cairo");
  assert.equal(payload.sub_district, "madinaty");
});
