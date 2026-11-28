import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCatalogApiFilters,
  hasCatalogApiFilters,
} from "../catalog-api-filters.js";

const units = [
  { code: "A", city: "new cairo", district: "fifth settlement", subDistrict: "", project: "Mountain View iCity", roomsCount: 3, totalPrice: 5_000_000 },
  { code: "B", city: "new cairo", district: "madinaty", subDistrict: "b12", project: "Madinaty B12", roomsCount: 2, totalPrice: 3_000_000 },
  { code: "C", city: "cairo", district: "el shorouk city", subDistrict: "", project: "Al Shorouk", roomsCount: 3, totalPrice: null },
  { code: "D", city: "new administrative capital", district: "r7", subDistrict: "", project: "Mountain View iCity", roomsCount: 4, totalPrice: 8_000_000 },
];

const codes = (list) => list.map((unit) => unit.code);

test("no filters returns every unit", () => {
  assert.deepEqual(codes(applyCatalogApiFilters(units, {})), ["A", "B", "C", "D"]);
  assert.equal(hasCatalogApiFilters({}), false);
  assert.equal(hasCatalogApiFilters({ city: "", bedrooms: "" }), false);
  assert.equal(hasCatalogApiFilters({ bedrooms: 3 }), true);
});

test("city, district and sub_district match the lowercased value exactly", () => {
  assert.deepEqual(codes(applyCatalogApiFilters(units, { city: "New Cairo" })), ["A", "B"]);
  assert.deepEqual(
    codes(applyCatalogApiFilters(units, { city: "new cairo", district: "Fifth Settlement" })),
    ["A"],
  );
  assert.deepEqual(codes(applyCatalogApiFilters(units, { subDistrict: "B12" })), ["B"]);
  // Equality, not substring: "cairo" is not "new cairo".
  assert.deepEqual(codes(applyCatalogApiFilters(units, { city: "cairo" })), ["C"]);
});

test("project_name is exact equality, like the backend", () => {
  assert.deepEqual(
    codes(applyCatalogApiFilters(units, { project: "Mountain View iCity" })),
    ["A", "D"],
  );
  assert.deepEqual(codes(applyCatalogApiFilters(units, { project: "Mountain View" })), []);
});

test("bedrooms matches roomsCount exactly", () => {
  assert.deepEqual(codes(applyCatalogApiFilters(units, { bedrooms: 3 })), ["A", "C"]);
  assert.deepEqual(codes(applyCatalogApiFilters(units, { bedrooms: "4" })), ["D"]);
});

test("price bounds are inclusive and drop units without a price", () => {
  assert.deepEqual(
    codes(applyCatalogApiFilters(units, { minPrice: 3_000_000, maxPrice: 5_000_000 })),
    ["A", "B"],
  );
  assert.deepEqual(codes(applyCatalogApiFilters(units, { minPrice: 6_000_000 })), ["D"]);
  assert.deepEqual(codes(applyCatalogApiFilters(units, { maxPrice: 3_000_000 })), ["B"]);
});

test("max below min returns nothing", () => {
  assert.deepEqual(applyCatalogApiFilters(units, { minPrice: 5_000_000, maxPrice: 1 }), []);
});

test("filters combine with AND", () => {
  assert.deepEqual(
    codes(applyCatalogApiFilters(units, { city: "new cairo", bedrooms: 3, maxPrice: 6_000_000 })),
    ["A"],
  );
});
