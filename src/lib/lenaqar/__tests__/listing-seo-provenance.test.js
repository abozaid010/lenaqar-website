import { test } from "node:test";
import assert from "node:assert/strict";
import { buildListingDescription, buildListingSchema, isoDateModified } from "../listing-seo.js";

const unit = {
  code: "OPP-123",
  buildingType: "apartment",
  project: "Madinaty",
  totalPrice: 2500000,
  landArea: 120,
  deliveryYear: 2027,
};

test("listing metadata uses neutral price wording without claiming developer sourcing", () => {
  const description = buildListingDescription({ ...unit, updatedAt: "2026-11-03" });
  assert.match(description, /السعر الإجمالي المعروض/);
  assert.doesNotMatch(description, /المطور|بتاريخه/);
});

test("schema does not treat updatedAt as the original posting date or seller evidence", () => {
  const schema = buildListingSchema({ ...unit, developer: "Example Developer", updatedAt: "2026-11-03" }, "/opportunities/OPP-123");
  assert.equal(schema.datePosted, undefined);
  assert.equal(schema.offers.seller, undefined);
});

test("schema retains an explicit posting date when present", () => {
  const schema = buildListingSchema({ ...unit, datePosted: "2026-10-20" }, "/opportunities/OPP-123");
  assert.equal(schema.datePosted, "2026-10-20");
});

test("dateModified comes from a valid, non-future updatedAt as ISO", () => {
  const schema = buildListingSchema({ ...unit, updatedAt: "2026-11-03T05:36:42.834320Z" }, "/opportunities/OPP-123");
  assert.equal(schema.dateModified, "2026-11-03T05:36:42.834Z");
  assert.equal(schema.datePosted, undefined);
});

test("dateModified is omitted when updatedAt is missing, invalid or in the future", () => {
  const url = "/opportunities/OPP-123";
  assert.equal("dateModified" in buildListingSchema(unit, url), false);
  assert.equal("dateModified" in buildListingSchema({ ...unit, updatedAt: null }, url), false);
  assert.equal("dateModified" in buildListingSchema({ ...unit, updatedAt: "not a date" }, url), false);
  assert.equal("dateModified" in buildListingSchema({ ...unit, updatedAt: "2999-01-01" }, url), false);
});

test("isoDateModified accepts today and rejects tomorrow against a fixed clock", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  assert.equal(isoDateModified("2026-11-24T11:59:59Z", now), "2026-11-24T11:59:59.000Z");
  assert.equal(isoDateModified("2026-11-25T00:00:00Z", now), null);
  assert.equal(isoDateModified("", now), null);
});

test("delivery year is not presented as the installment end date", () => {
  const description = buildListingDescription({ ...unit, downPayment: 500000, remainingAmount: 2000000, installmentYears: 9 });
  assert.doesNotMatch(description, /حتى 2027/);
  assert.match(description, /خطة السداد/);
});

test("listing attributes use Accommodation/Place rather than unsupported WebPage properties", () => {
  const schema = buildListingSchema({ ...unit, downPayment: 500000, remainingAmount: 2000000, installmentYears: 9 }, "/opportunities/OPP-123");
  assert.equal(schema.additionalProperty, undefined);
  assert.equal(schema.mainEntity["@type"], "Accommodation");
  assert.ok(schema.mainEntity.additionalProperty.some(p => p.name === "مدة التقسيط" && p.value === 9));
});
