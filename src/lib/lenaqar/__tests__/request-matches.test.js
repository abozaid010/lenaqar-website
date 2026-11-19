/**
 * Match page helpers. Run with:
 * node --test src/lib/lenaqar/__tests__/request-matches.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { isRequestNotFound, matchInfo, requestSummary } from "../request-matches.js";

test("a unit without a near-miss label is a match", () => {
  assert.deepEqual(matchInfo({ code: "A" }), { kind: "match" });
  assert.deepEqual(matchInfo(null), { kind: "match" });
});

test("a near miss says which rule it breaks and by how much", () => {
  assert.deepEqual(
    matchInfo({ match_kind: "closest", miss: "over_price_cap", over_by: { total_price: 150000 } }),
    { kind: "closest", labelKey: "overPrice", amount: 150000 },
  );
  assert.deepEqual(
    matchInfo({ match_kind: "closest", miss: "over_down_payment_cap", over_by: { down_payment: 50000 } }),
    { kind: "closest", labelKey: "overDownPayment", amount: 50000 },
  );
  assert.deepEqual(matchInfo({ match_kind: "closest", miss: "location_mismatch", over_by: {} }), {
    kind: "closest",
    labelKey: "location",
    amount: null,
  });
  assert.equal(matchInfo({ match_kind: "closest", miss: "after_delivery_deadline" }).labelKey, "delivery");
});

test("a money label without an amount, or an unknown rule, falls back to the plain label", () => {
  const plain = { kind: "closest", labelKey: "other", amount: null };
  assert.deepEqual(matchInfo({ match_kind: "closest", miss: "over_price_cap", over_by: {} }), plain);
  assert.deepEqual(matchInfo({ match_kind: "closest", miss: "over_price_cap" }), plain);
  assert.deepEqual(matchInfo({ match_kind: "closest", miss: "something_new" }), plain);
});

test("request summary keeps what the buyer stated and nothing else", () => {
  const summary = requestSummary({
    purpose: "buy",
    max_price: 4500000,
    min_price: 3375000,
    roomsCount: 3,
    preferred_property_types: ["apartment", ""],
    preferred_locations: [
      { city: "new cairo", district: null, sub_district: null, project: null },
      { city: "cairo", district: "el shorouk city", sub_district: null, project: null },
    ],
  });
  assert.deepEqual(summary, {
    places: [{ city: "new cairo" }, { city: "cairo", district: "el shorouk city" }],
    propertyTypes: ["apartment"],
    maxPrice: 4500000,
    downPayment: null,
    rooms: 3,
  });
  assert.deepEqual(requestSummary(null), {
    places: [],
    propertyTypes: [],
    maxPrice: null,
    downPayment: null,
    rooms: null,
  });
});

test("a 404 is 'request not found' only when the backend says so", () => {
  // Production error shape (seen live 2026-11-19) and the bare FastAPI shape.
  assert.equal(
    isRequestNotFound({ status: false, code: 404, error_message: "Request not found" }),
    true,
  );
  assert.equal(isRequestNotFound({ detail: "Request not found" }), true);
  // A backend without the route answers a generic 404: the request may well exist.
  assert.equal(isRequestNotFound({ detail: "Not Found" }), false);
  assert.equal(isRequestNotFound({ error_message: "Unit not found" }), false);
  assert.equal(isRequestNotFound(null), false);
});
