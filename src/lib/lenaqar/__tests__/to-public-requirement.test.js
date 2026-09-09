/**
 * Public buy-request / requirement payload sanitizer tests.
 * node --test src/lib/lenaqar/__tests__/to-public-requirement.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePublicIntent,
  toPublicRequirement,
} from "../to-public-requirement.js";

test("blocks rent and sell intent", () => {
  assert.equal(resolvePublicIntent({ purpose: "rent" }), null);
  assert.equal(resolvePublicIntent({ propertyIntent: "lease" }), null);
  assert.equal(resolvePublicIntent({ purpose: "sell" }), null);
});

test("allows buy; defaults missing intent to buy", () => {
  assert.equal(resolvePublicIntent({ purpose: "buy" }), "buy");
  assert.equal(resolvePublicIntent({}), "buy");
});

test("drops PII and CRM fields from the public payload", () => {
  const publicRow = toPublicRequirement({
    id: "req-1",
    user_id: "user-secret",
    client_id: "lenaqar",
    assigned_to: "broker@example.com",
    purpose: "buy",
    preferred_locations: [{ city: "cairo", district: "new cairo" }],
    preferred_property_types: ["apartment"],
    roomsCount: 3,
    max_price: 5_000_000,
    additionalFeatures: [
      "مطلوب شقة في تاج سيتي\nكلمني على +201000000000 أو name@example.com",
    ],
    lead: { name: "Real Person", phone_number: "+201000000000" },
    matched_units: ["U1"],
    matched_units_comment: "internal note",
    score: 99,
  });

  assert.ok(publicRow);
  assert.equal(publicRow.intent, "buy");
  assert.equal(publicRow.roomsCount, 3);
  assert.equal(publicRow.maxPrice, 5_000_000);
  assert.deepEqual(publicRow.propertyTypes, ["apartment"]);
  assert.equal(publicRow.locations[0].city, "cairo");
  assert.match(publicRow.notes, /مطلوب شقة في تاج سيتي/);
  assert.equal(publicRow.notes.includes("+201000000000"), false);
  assert.equal(publicRow.notes.includes("name@example.com"), false);
  assert.equal("lead" in publicRow, false);
  assert.equal("user_id" in publicRow, false);
  assert.equal("assigned_to" in publicRow, false);
  assert.equal("matched_units" in publicRow, false);
  assert.equal("additionalFeatures" in publicRow, false);
  assert.equal("score" in publicRow, false);
  assert.notEqual(publicRow.id, "req-1");
  assert.notEqual(publicRow.id, "user-secret");
});

test("rejects rent even with otherwise valid fields", () => {
  assert.equal(
    toPublicRequirement({
      purpose: "rent",
      preferred_locations: [{ city: "cairo" }],
      roomsCount: 2,
      max_price: 10000,
    }),
    null,
  );
});

test("rejects location-only stubs with no useful criteria", () => {
  assert.equal(
    toPublicRequirement({
      purpose: "buy",
      preferred_locations: [{ city: "cairo" }],
    }),
    null,
  );
});
