/**
 * Buy-request ad attribution (utm_* + lead_code). Run with:
 * node --test src/lib/lenaqar/__tests__/attribution.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  ATTRIBUTION_KEYS,
  ATTRIBUTION_VALUE_MAX,
  captureAttribution,
  parseAttribution,
  readAttribution,
  sanitizeAttribution,
} from "../attribution.js";

function fakeBrowser(search) {
  const store = new Map();
  globalThis.window = { location: { search } };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    },
  });
  return store;
}

test("parser reads the six keys from a landing query string", () => {
  const out = parseAttribution(
    "?utm_source=meta&utm_medium=paid_social&utm_campaign=camp_a&utm_content=ad_1&utm_term=adset_1&lead_code=LC-7",
  );
  assert.deepEqual(out, {
    utm_source: "meta",
    utm_medium: "paid_social",
    utm_campaign: "camp_a",
    utm_content: "ad_1",
    utm_term: "adset_1",
    lead_code: "LC-7",
  });
  assert.deepEqual(Object.keys(out), ATTRIBUTION_KEYS);
});

test("parser ignores other params, trims, and drops empty values", () => {
  const out = parseAttribution(
    "city=cairo&utm_source=%20google%20&utm_medium=&fbclid=abc&utm_id=9",
  );
  assert.deepEqual(out, { utm_source: "google" });
});

test("parser returns an empty object when nothing is present", () => {
  assert.deepEqual(parseAttribution(""), {});
  assert.deepEqual(parseAttribution(undefined), {});
  assert.deepEqual(parseAttribution("?page=2"), {});
});

test("parser decodes encoded values and caps their length", () => {
  const long = "x".repeat(ATTRIBUTION_VALUE_MAX + 50);
  const out = parseAttribution(`utm_campaign=eg%20new%20cairo&utm_content=${long}`);
  assert.equal(out.utm_campaign, "eg new cairo");
  assert.equal(out.utm_content.length, ATTRIBUTION_VALUE_MAX);
});

test("whitelist keeps only the six keys as non-empty strings", () => {
  const out = sanitizeAttribution({
    utm_source: " meta ",
    utm_medium: 42,
    utm_campaign: { nested: true },
    utm_content: "   ",
    lead_code: "LC-1",
    client_id: "other",
    campaign_id: "other",
    phone: "other",
  });
  assert.deepEqual(out, { utm_source: "meta", lead_code: "LC-1" });
});

test("whitelist returns an empty object for non-object input", () => {
  for (const input of [null, undefined, "utm_source=meta", 7, []]) {
    assert.deepEqual(sanitizeAttribution(input), {});
  }
});

test("whitelist caps each value", () => {
  const out = sanitizeAttribution({ utm_term: "y".repeat(ATTRIBUTION_VALUE_MAX * 2) });
  assert.equal(out.utm_term.length, ATTRIBUTION_VALUE_MAX);
});

test("capture stores the landing values and first touch wins", () => {
  fakeBrowser("?utm_source=meta&utm_content=ad_1");
  captureAttribution();
  assert.deepEqual(readAttribution(), { utm_source: "meta", utm_content: "ad_1" });

  globalThis.window.location.search = "?utm_source=google&lead_code=LC-2";
  captureAttribution();
  assert.deepEqual(readAttribution(), { utm_source: "meta", utm_content: "ad_1" });
});

test("capture stores nothing when the landing URL has no attribution", () => {
  const store = fakeBrowser("?city=cairo");
  captureAttribution();
  assert.equal(store.size, 0);
  assert.deepEqual(readAttribution(), {});
});

test("capture and read survive blocked storage", () => {
  globalThis.window = { location: { search: "?utm_source=meta" } };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    },
  });
  assert.doesNotThrow(() => captureAttribution());
  assert.deepEqual(readAttribution(), {});
});
