/**
 * Delivery wording of a unit card. Run with:
 * node --test src/lib/lenaqar/__tests__/delivery-display.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { deliveryDisplay } from "../delivery-display.js";

const NOW = new Date("2026-11-20T10:00:00Z");

test("a delivery date in the past is ready", () => {
  assert.deepEqual(deliveryDisplay({ deliveryDate: "2025-03-01" }, NOW), { ready: true });
  assert.deepEqual(deliveryDisplay({ deliveryDate: "2026-11-01" }, NOW), { ready: true });
});

test("a delivery date still ahead is shown as it is", () => {
  const out = deliveryDisplay({ deliveryDate: "2027-08-01" }, NOW);
  assert.equal(out.ready, false);
  assert.equal(out.date.getFullYear(), 2027);
  assert.equal(deliveryDisplay({ deliveryDate: "2026-12-01" }, NOW).ready, false);
});

test("an already delivered unit is ready whatever the date", () => {
  assert.deepEqual(deliveryDisplay({ isDelivered: true, deliveryDate: "2030-01-01" }, NOW), { ready: true });
});

test("without a date, an earlier year is ready and this or a later year is shown", () => {
  assert.deepEqual(deliveryDisplay({ deliveryYear: 2024 }, NOW), { ready: true });
  assert.deepEqual(deliveryDisplay({ deliveryYear: 2026 }, NOW), { ready: false, date: null, year: 2026 });
  assert.deepEqual(deliveryDisplay({ deliveryYear: 2028 }, NOW), { ready: false, date: null, year: 2028 });
});

test("a missing, broken or out-of-range date says nothing", () => {
  const none = { ready: false, date: null, year: null };
  assert.deepEqual(deliveryDisplay({}, NOW), none);
  assert.deepEqual(deliveryDisplay(null, NOW), none);
  assert.deepEqual(deliveryDisplay({ deliveryDate: "soon" }, NOW), none);
  assert.deepEqual(deliveryDisplay({ deliveryDate: "1800-01-01" }, NOW), none);
});
