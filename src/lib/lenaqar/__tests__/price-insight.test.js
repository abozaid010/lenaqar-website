/**
 * Average asking prices on the buy-request success screen. Run with:
 * node --test src/lib/lenaqar/__tests__/price-insight.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { priceInsightQuery, toPriceInsightView } from "../price-insight.js";

const AVAILABLE = {
  available: true,
  sample_size: 30,
  scope: {
    level: "district",
    city: "new cairo",
    district: "fifth settlement",
    sub_district: null,
    property_type: "apartment",
    bedrooms: 3,
  },
  relaxed: ["delivery"],
  median_price_per_sqm: 38500.4,
  median_unit_price: 5650000,
  lowest_unit_price: 3900000,
  highest_unit_price: 8200000,
  basis: "resale_cash_value",
  as_of: "2026-11-11",
};

const placeAr = (value) =>
  ({ "new cairo": "القاهرة الجديدة", "fifth settlement": "التجمع الخامس" })[value] || "";

test("query is built from the flat form requirement", () => {
  assert.deepEqual(
    priceInsightQuery({
      purpose: "buy",
      city: "New Cairo",
      district: "Fifth Settlement",
      buildingType: "Apartment",
      roomsCount: 3,
      max_price: 5000000,
      deliveryDate: "less_than_2_years",
    }),
    {
      city: "new cairo",
      district: "fifth settlement",
      property_type: "apartment",
      bedrooms: 3,
      delivery: "less_than_2_years",
    },
  );
});

test("query carries sub-district and area when the requirement has them", () => {
  const query = priceInsightQuery({
    city: "new cairo",
    district: "fifth settlement",
    sub_district: "al narges",
    buildingType: "villa",
    land_area: "250",
  });
  assert.equal(query.sub_district, "al narges");
  assert.equal(query.area, 250);
});

test("query reads the first preferred location and property type of a stored requirement", () => {
  const query = priceInsightQuery({
    preferred_locations: [
      { city: "6 october", district: "sheikh zayed", sub_district: null },
      { city: "new cairo", district: "fifth settlement" },
    ],
    preferred_property_types: ["villa", "townhouse"],
  });
  assert.deepEqual(query, {
    city: "6 october",
    district: "sheikh zayed",
    property_type: "villa",
  });
});

test("no city or no property type means no query at all", () => {
  assert.equal(priceInsightQuery({ buildingType: "apartment" }), null);
  assert.equal(priceInsightQuery({ city: "new cairo" }), null);
  assert.equal(priceInsightQuery(null), null);
  assert.equal(priceInsightQuery("new cairo"), null);
});

test("query never carries budget, contact or notes", () => {
  const query = priceInsightQuery({
    city: "new cairo",
    buildingType: "apartment",
    max_price: 5000000,
    downPayment: 500000,
    name: "Buyer Name",
    phone: "+201000000001",
    additionalFeatures: ["garden view"],
  });
  assert.deepEqual(Object.keys(query).sort(), ["city", "property_type"]);
});

test("unusable numbers are dropped from the query", () => {
  const query = priceInsightQuery({
    city: "new cairo",
    buildingType: "apartment",
    roomsCount: "abc",
    land_area: -5,
  });
  assert.equal("bedrooms" in query, false);
  assert.equal("area" in query, false);
});

test("view names the scope the figures cover", () => {
  const view = toPriceInsightView(AVAILABLE, placeAr);
  assert.deepEqual(view, {
    level: "district",
    place: { en: "fifth settlement", ar: "التجمع الخامس" },
    propertyType: "apartment",
    perMeter: 38500,
    unitPrice: 5650000,
    lowest: 3900000,
    highest: 8200000,
    estimated: null,
    count: 30,
    asOf: "2026-11-11",
  });
});

test("figures widened to the city are labelled with the city, not the district asked for", () => {
  const view = toPriceInsightView(
    {
      ...AVAILABLE,
      relaxed: ["delivery", "bedrooms", "district"],
      scope: { ...AVAILABLE.scope, level: "city", district: null },
    },
    placeAr,
  );
  assert.equal(view.level, "city");
  assert.deepEqual(view.place, { en: "new cairo", ar: "القاهرة الجديدة" });
});

test("a sub-district scope is labelled with the sub-district", () => {
  const view = toPriceInsightView(
    {
      ...AVAILABLE,
      scope: { ...AVAILABLE.scope, level: "sub_district", sub_district: "al narges" },
    },
    placeAr,
  );
  assert.deepEqual(view.place, { en: "al narges", ar: "" });
});

test("an estimate is kept only when the backend sent one", () => {
  assert.equal(toPriceInsightView(AVAILABLE, placeAr).estimated, null);
  assert.equal(
    toPriceInsightView({ ...AVAILABLE, estimated_total: 5775000 }, placeAr).estimated,
    5775000,
  );
});

test("no figures when the sample was too small", () => {
  assert.equal(toPriceInsightView({ available: false, sample_size: 3 }, placeAr), null);
});

test("anything that is not a complete answer shows nothing", () => {
  assert.equal(toPriceInsightView(null, placeAr), null);
  assert.equal(toPriceInsightView(undefined, placeAr), null);
  assert.equal(toPriceInsightView("error", placeAr), null);
  assert.equal(toPriceInsightView({ available: true }, placeAr), null);
  assert.equal(
    toPriceInsightView({ ...AVAILABLE, median_price_per_sqm: 0 }, placeAr),
    null,
  );
  assert.equal(
    toPriceInsightView({ ...AVAILABLE, median_unit_price: "n/a" }, placeAr),
    null,
  );
  assert.equal(
    toPriceInsightView({ ...AVAILABLE, scope: { level: "city" } }, placeAr),
    null,
  );
});

test("view never carries anything beyond the display fields", () => {
  const view = toPriceInsightView(
    { ...AVAILABLE, lowest_unit: { code: "aXcvoehA" }, client_id: "lenaqar" },
    placeAr,
  );
  assert.equal(JSON.stringify(view).includes("aXcvoehA"), false);
  assert.equal(JSON.stringify(view).includes("lenaqar"), false);
});

test("an answer in the old field names shows nothing rather than half a card", () => {
  const legacy = {
    ...AVAILABLE,
    median_price_per_sqm: undefined,
    median_unit_price: undefined,
    avg_price_per_sqm: 38500,
    avg_total_price: 5650000,
  };
  assert.equal(toPriceInsightView(legacy, placeAr), null);
});
