/**
 * Run: node --test src/lib/lenaqar/__tests__/guide-inventory-summary.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GUIDE_INVENTORY,
  buildInventorySummary,
  definedSample,
  inventoryConfigForGuide,
  recordDateRange,
  summarizeSegment,
} from "../../guides/inventory-summary.js";
import { guideAreaForUnit } from "../../guides/area-guides.js";

const madinaty = GUIDE_INVENTORY["/guides/madinaty/prices-2026"];
const newCairo = GUIDE_INVENTORY["/guides/new-cairo/prices-2026"];

let seq = 0;
/** A public catalog item (shape of fetchOpportunityCatalog rows). */
const unit = (over = {}) => ({
  code: `U${++seq}`,
  city: "new cairo",
  district: "madinaty",
  buildingType: "apartment",
  isPrimary: false,
  roomsCount: 3,
  landArea: 100,
  totalPrice: 6_000_000,
  updatedAt: "2026-11-01T10:00:00Z",
  ...over,
});
/** n in-sample Madinaty units with distinct prices, newest date first. */
const madinatyUnits = (n, rooms = 3, from = 5_000_000) =>
  Array.from({ length: n }, (_, i) => unit({ roomsCount: rooms, totalPrice: from + i * 100_000, updatedAt: `2026-10-${String(10 + (i % 15)).padStart(2, "0")}` }));

test("config lookup accepts stored slugs; city-level markets are marked", () => {
  assert.equal(inventoryConfigForGuide("/guides/madinaty/prices-2026/"), madinaty);
  assert.equal(inventoryConfigForGuide("/guides/new-cairo/prices-2026/").level, "city");
  assert.equal(inventoryConfigForGuide("/guides/sheikh-zayed/prices-2026/"), null);
});

test("REGRESSION (PR #47 review): counts, statistics and dates come from ONE sample", () => {
  const inSample = madinatyUnits(24);
  const noise = [
    unit({ district: "fifth settlement", updatedAt: "2020-01-01" }), // other district
    unit({ city: "6 october", updatedAt: "2020-01-02" }), // other city, same district token
    unit({ buildingType: "villa", totalPrice: 40_000_000, updatedAt: "2020-01-03" }), // not an apartment
    unit({ isPrimary: true, updatedAt: "2020-01-04" }), // developer unit
    unit({ landArea: 1, updatedAt: "2020-01-05" }), // impossible price per m²
    unit({ totalPrice: null, updatedAt: "2020-01-06" }), // no price
    { ...inSample[0], updatedAt: "2020-01-07" }, // duplicate listing code
  ];
  const summary = buildInventorySummary(madinaty, [...inSample, ...noise], { asOf: "2026-11-15" });

  // The headline count, the stated sample size and the dated listings are the same units.
  assert.equal(summary.sampleSize, 24);
  assert.equal(summary.rows[0].count, 24);
  assert.equal(summary.records.dated, 24);
  // No excluded unit leaks into the freshness range or the statistics.
  assert.equal(summary.records.earliest, "2026-10-10");
  assert.deepEqual(summary, buildInventorySummary(madinaty, inSample, { asOf: "2026-11-15" }));
});

test("statistics are medians over the sample; range trims 5% tails from 20 units", () => {
  const sample = definedSample(madinatyUnits(20), madinaty); // 5.0M … 6.9M, 100 m²
  const row = summarizeSegment(sample, madinaty.segments[0]);
  assert.equal(row.count, 20);
  assert.equal(row.unitPrice, 5_950_000);
  assert.equal(row.perMeter, 59_500);
  assert.equal(row.lowest, 5_100_000); // cheapest 1 (5%) left out
  assert.equal(row.highest, 6_800_000); // dearest 1 left out
});

test("thin bedroom categories are omitted; no headline row means no section", () => {
  const units = [...madinatyUnits(22, 3), ...madinatyUnits(5, 2)];
  const summary = buildInventorySummary(madinaty, units, { asOf: "2026-11-15" });
  assert.deepEqual(summary.rows.map((r) => [r.bedrooms, r.count]), [[null, 27], [3, 22]]);
  assert.equal(buildInventorySummary(madinaty, madinatyUnits(19), { asOf: "x" }), null);
  assert.equal(buildInventorySummary(madinaty, madinatyUnits(25).map((u) => ({ ...u, updatedAt: null })), { asOf: "x" }), null);
});

test("city-level markets use every district of that city and nothing else", () => {
  const units = [
    ...madinatyUnits(12),
    ...madinatyUnits(12).map((u) => ({ ...u, district: "fifth settlement" })),
    unit({ city: "cairo", district: "el shorouk city" }),
  ];
  const summary = buildInventorySummary(newCairo, units, { asOf: "2026-11-15" });
  assert.equal(summary.sampleSize, 24);
  assert.equal(summary.rows[0].count, 24);
});

test("record date range ignores listings without a valid date", () => {
  const sample = definedSample([unit({ updatedAt: "2026-09-17" }), unit({ updatedAt: "bad" }), unit({ updatedAt: "2026-11-14T08:00:00Z" })], madinaty);
  assert.deepEqual(recordDateRange(sample), { earliest: "2026-09-17", latest: "2026-11-14", dated: 2 });
});

test("feed spelling 'mostaqbal city' maps to the Mostakbal City guides", () => {
  assert.equal(guideAreaForUnit({ city: "new cairo", district: "mostaqbal city" }), "mostakbal-city");
});
