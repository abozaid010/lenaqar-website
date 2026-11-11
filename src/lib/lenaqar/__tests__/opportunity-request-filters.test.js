/**
 * Filters that reach /opportunities from a buy request (rooms, price, type).
 * Run with: node --test src/lib/lenaqar/__tests__/opportunity-request-filters.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  REQUEST_FILTER_KEYS,
  queryWithoutFilters,
  readRequestFilters,
} from "../opportunity-request-filters.js";

const FROM_BUY_REQUEST =
  "city=new+cairo&district=fifth+settlement&bedrooms=2&max_price=2400000&property_type=apartment&cash=2000000";

test("reads the filters the filter bar has no field for", () => {
  assert.deepEqual(readRequestFilters(new URLSearchParams(FROM_BUY_REQUEST)), [
    { key: "property_type", value: "apartment" },
    { key: "bedrooms", value: 2 },
    { key: "max_price", value: 2400000 },
  ]);
});

test("location, cash and delivery are the bar's own fields and are not listed", () => {
  const filters = readRequestFilters(
    new URLSearchParams("city=new+cairo&district=madinaty&cash=500000&delivery=2027"),
  );
  assert.deepEqual(filters, []);
});

test("reads a price floor too", () => {
  assert.deepEqual(
    readRequestFilters(new URLSearchParams("min_price=1000000&max_price=3000000")),
    [
      { key: "min_price", value: 1000000 },
      { key: "max_price", value: 3000000 },
    ],
  );
});

test("values the listing ignores are not shown as filters", () => {
  const filters = readRequestFilters(
    new URLSearchParams("bedrooms=abc&max_price=0&min_price=-5&property_type=+"),
  );
  assert.deepEqual(filters, []);
});

test("removing one filter keeps every other part of the search", () => {
  const next = new URLSearchParams(
    queryWithoutFilters(new URLSearchParams(FROM_BUY_REQUEST), ["max_price"]),
  );
  assert.equal(next.has("max_price"), false);
  assert.equal(next.get("bedrooms"), "2");
  assert.equal(next.get("property_type"), "apartment");
  assert.equal(next.get("city"), "new cairo");
  assert.equal(next.get("district"), "fifth settlement");
  assert.equal(next.get("cash"), "2000000");
});

test("removing all request filters leaves the bar's own filters", () => {
  const next = new URLSearchParams(
    queryWithoutFilters(new URLSearchParams(FROM_BUY_REQUEST), REQUEST_FILTER_KEYS),
  );
  assert.deepEqual([...next.keys()].sort(), ["cash", "city", "district"]);
});

test("a changed result set always restarts at page 1", () => {
  const next = new URLSearchParams(
    queryWithoutFilters(new URLSearchParams(`${FROM_BUY_REQUEST}&page=3`), ["bedrooms"]),
  );
  assert.equal(next.has("page"), false);
});

test("removing the last filter gives an empty query", () => {
  assert.equal(queryWithoutFilters(new URLSearchParams("bedrooms=2"), ["bedrooms"]), "");
});
