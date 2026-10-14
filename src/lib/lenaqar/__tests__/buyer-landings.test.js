/**
 * Run: node --test src/lib/lenaqar/__tests__/buyer-landings.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getBuyerLanding,
  filterRequirementsForLanding,
  BUYER_LANDINGS,
} from "../buyer-landings.js";

test("buyer landings cover strategy priority URLs", () => {
  const hrefs = BUYER_LANDINGS.map((p) => p.href);
  assert.ok(hrefs.includes("/apartments-for-sale/new-cairo"));
  assert.ok(hrefs.includes("/chalets-for-sale/north-coast"));
  assert.ok(hrefs.includes("/ready-to-move-properties"));
});

test("filterRequirementsForLanding matches New Cairo keywords without fabricating rows", () => {
  const landing = getBuyerLanding("apartments-for-sale/new-cairo");
  const rows = [
    {
      id: "1",
      locations: [{ city: "cairo", district: "new cairo" }],
      notes: "",
    },
    {
      id: "2",
      locations: [{ city: "north coast" }],
      notes: "",
    },
  ];
  const matched = filterRequirementsForLanding(rows, landing);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, "1");
});

test("ready-to-move filter uses delivery tokens only", () => {
  const landing = getBuyerLanding("ready-to-move-properties");
  const rows = [
    { id: "a", deliveryDate: "ready", locations: [] },
    { id: "b", deliveryDate: "less_than_2_years", locations: [] },
  ];
  const matched = filterRequirementsForLanding(rows, landing);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, "a");
});
