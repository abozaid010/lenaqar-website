import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isExplicitUnitNotFound, normalizeOpportunityCode } from "../unit-lookup.js";

test("percent-encoded route params are decoded once before lookup", () => {
  assert.equal(normalizeOpportunityCode("63%2F50%2F13"), "63/50/13");
  assert.equal(normalizeOpportunityCode("%D9%85%D8%AD%D9%84%20%D8%B1%D9%82%D9%85%2029"), "محل رقم 29");
  assert.equal(normalizeOpportunityCode(" kBqU7H1A "), "kBqU7H1A");
  assert.equal(normalizeOpportunityCode("100%"), "100%");
  assert.equal(normalizeOpportunityCode(null), "");
});

test("backend not-found body (HTTP 200, code 404) is an explicit not-found", () => {
  assert.ok(
    isExplicitUnitNotFound({ status: false, code: 404, data: null, error_message: "Unit not found" }),
  );
  assert.ok(isExplicitUnitNotFound({ status: false, code: "404" }));
});

test("failed lookups are not treated as proof the unit is gone", () => {
  assert.ok(!isExplicitUnitNotFound(null));
  assert.ok(!isExplicitUnitNotFound(undefined));
  assert.ok(!isExplicitUnitNotFound({ status: false, code: 500 }));
  assert.ok(!isExplicitUnitNotFound({ status: false }));
});

test("a found unit is not a not-found", () => {
  assert.ok(!isExplicitUnitNotFound({ status: true, code: 200, data: { code: "kBqU7H1A" } }));
});

// Regression guard: a no-store fetch inside the ISR detail route made every
// non-prerendered /opportunities/<code> answer HTTP 500 in production.
test("Arabic label catalog fetch stays ISR-compatible (no no-store)", () => {
  const source = readFileSync(
    new URL("../arabic-labels.server.js", import.meta.url),
    "utf8",
  );
  assert.ok(!/cache:\s*["']no-store["']/.test(source));
  assert.ok(!/revalidate:\s*0\b/.test(source));
});
