/**
 * Run: node --test src/lib/lenaqar/__tests__/guide-inventory-summary.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GUIDE_INVENTORY,
  buildInventorySummary,
  inventoryConfigForGuide,
  priceInsightParams,
  recordDateRange,
  toSummaryRow,
} from "../../guides/inventory-summary.js";
import { guideAreaForUnit } from "../../guides/area-guides.js";

const config = GUIDE_INVENTORY["/guides/madinaty/prices-2026"];
const [ALL, TWO, THREE] = config.segments;

/** Shape of a real /public/v1/price-insight answer (2026-11-15). */
function answer({ bedrooms = null, relaxed = [], level = "district", n = 46, ...rest } = {}) {
  return {
    available: true,
    sample_size: n,
    scope: {
      level,
      city: level === "country" ? null : "new cairo",
      district: level === "district" ? "madinaty" : null,
      sub_district: null,
      property_type: "apartment",
      bedrooms,
    },
    relaxed,
    median_price_per_sqm: 64154,
    median_unit_price: 5509455,
    lowest_unit_price: 4466487,
    highest_unit_price: 8394790,
    basis: "resale_cash_value",
    as_of: "2026-11-15",
    ...rest,
  };
}

test("config lookup accepts the stored slug with its trailing slash", () => {
  assert.equal(inventoryConfigForGuide("/guides/madinaty/prices-2026/"), config);
  assert.equal(inventoryConfigForGuide("/guides/sheikh-zayed/prices-2026/"), null);
  assert.equal(inventoryConfigForGuide("/guides/new-cairo/prices-2026/").level, "city");
});

test("query carries bedrooms only for a bedroom segment", () => {
  assert.deepEqual(priceInsightParams(config, ALL), {
    city: "new cairo", district: "madinaty", property_type: "apartment",
  });
  assert.equal(priceInsightParams(config, TWO).bedrooms, 2);
});

test("a district answer with enough units becomes a row", () => {
  assert.deepEqual(toSummaryRow(answer({ bedrooms: 2 }), config, TWO), {
    labelAr: TWO.labelAr,
    bedrooms: 2,
    count: 46,
    perMeter: 64154,
    unitPrice: 5509455,
    lowest: 4466487,
    highest: 8394790,
    asOf: "2026-11-15",
  });
});

test("a widened answer is never printed under a narrower label", () => {
  // Real case: asking for 4 bedrooms in Madinaty returns the all-apartments figure.
  assert.equal(toSummaryRow(answer({ relaxed: ["bedrooms"], n: 121 }), config, THREE), null);
  assert.equal(toSummaryRow(answer({ bedrooms: null }), config, THREE), null);
  assert.equal(toSummaryRow(answer({ level: "city", relaxed: ["district"] }), config, ALL), null);
  assert.equal(toSummaryRow(answer({ level: "country", relaxed: ["district", "city"] }), config, ALL), null);
  const noRelaxedField = answer();
  delete noRelaxedField.relaxed;
  assert.equal(toSummaryRow(noRelaxedField, config, ALL), null);
});

test("thin, unavailable or incomplete answers are dropped", () => {
  assert.equal(toSummaryRow(answer({ n: 19 }), config, ALL), null);
  assert.ok(toSummaryRow(answer({ n: 20 }), config, ALL));
  assert.equal(toSummaryRow({ available: false, sample_size: 3 }, config, ALL), null);
  assert.equal(toSummaryRow(answer({ median_price_per_sqm: null }), config, ALL), null);
  assert.equal(toSummaryRow(null, config, ALL), null);
});

test("record dates cover only this district's units of this type", () => {
  const units = [
    { district: "madinaty", buildingType: "apartment", updatedAt: "2026-11-14T08:00:00Z" },
    { district: "madinaty", buildingType: "apartment", updatedAt: "2026-09-17T10:00:00Z" },
    { district: "madinaty", buildingType: "villa", updatedAt: "2026-01-01T00:00:00Z" },
    { district: "fifth settlement", buildingType: "apartment", updatedAt: "2025-01-01" },
    { district: "madinaty", buildingType: "apartment", updatedAt: null },
  ];
  assert.deepEqual(recordDateRange(units, config), { earliest: "2026-09-17", latest: "2026-11-14" });
  assert.equal(recordDateRange([], config), null);
});

test("summary needs the all-apartments row and known record dates", () => {
  const units = [{ district: "madinaty", buildingType: "apartment", updatedAt: "2026-11-14" }];
  const full = buildInventorySummary(
    config,
    [answer({ n: 121 }), answer({ bedrooms: 2 }), answer({ bedrooms: 3, n: 70 })],
    units,
  );
  assert.equal(full.rows.length, 3);
  assert.equal(full.asOf, "2026-11-15");
  // A thin bedroom row is omitted, the rest stays.
  const partial = buildInventorySummary(config, [answer({ n: 121 }), answer({ bedrooms: 2, n: 5 }), null], units);
  assert.deepEqual(partial.rows.map((r) => r.bedrooms), [null]);
  // No headline row, or no record dates: no section at all.
  assert.equal(buildInventorySummary(config, [null, answer({ bedrooms: 2 })], units), null);
  assert.equal(buildInventorySummary(config, [answer({ n: 121 })], []), null);
});

test("feed spelling 'mostaqbal city' maps to the Mostakbal City guides", () => {
  assert.equal(guideAreaForUnit({ city: "new cairo", district: "mostaqbal city" }), "mostakbal-city");
});

test("city-level markets: only a whole-city answer for that city becomes a row", () => {
  const nc = GUIDE_INVENTORY["/guides/new-cairo/prices-2026"];
  assert.deepEqual(priceInsightParams(nc, nc.segments[0]), { city: "new cairo", property_type: "apartment" });
  const cityAnswer = { ...answer({ n: 334 }), scope: { level: "city", city: "new cairo", district: null, property_type: "apartment", bedrooms: null } };
  assert.equal(toSummaryRow(cityAnswer, nc, nc.segments[0]).count, 334);
  // A district answer is narrower than the label; another city is wrong.
  assert.equal(toSummaryRow(answer({ n: 121 }), nc, nc.segments[0]), null);
  assert.equal(toSummaryRow({ ...cityAnswer, scope: { ...cityAnswer.scope, city: "6 october" } }, nc, nc.segments[0]), null);
  // Record dates for a city-level market use the city, not a district.
  assert.deepEqual(recordDateRange([{ city: "new cairo", district: "x", buildingType: "apartment", updatedAt: "2026-10-01" }], nc), { earliest: "2026-10-01", latest: "2026-10-01" });
});

test("a district answer from another city is rejected", () => {
  const fs5 = GUIDE_INVENTORY["/guides/fifth-settlement/prices-2026"];
  const wrongCity = { ...answer({ n: 151 }), scope: { level: "district", city: "cairo", district: "fifth settlement", property_type: "apartment", bedrooms: null } };
  assert.equal(toSummaryRow(wrongCity, fs5, fs5.segments[0]), null);
});
