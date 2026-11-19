/**
 * Buy-request repeat-submit guard. Run with:
 * node --test src/lib/lenaqar/__tests__/buy-request-repeat.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  REPEAT_WINDOW_MS,
  buyRequestSubmitKey,
  canonicalJson,
  isNewBuyRequestConversion,
  findRepeatSubmit,
  readLastBuyRequestSubmit,
  saveLastBuyRequestSubmit,
} from "../buy-request-repeat.js";

// Made-up numbers, not real people.
const PHONE = "+201000000001";
const OTHER_PHONE = "+201000000002";

function fakeBrowser() {
  const store = new Map();
  globalThis.window = {};
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

const REQ = { max_price: 5_000_000, preferred_locations: [{ city: "new cairo" }], buildingType: "apartment" };

test("key is a SHA-256 hex that does not contain the phone or the request", async () => {
  const key = await buyRequestSubmitKey({ phone: PHONE, name: "Ali", requirement: REQ });
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.ok(!key.includes("201000000001"));
});

test("the same submission gives the same key whatever the formatting or key order", async () => {
  const key = await buyRequestSubmitKey({ phone: PHONE, name: "Ali", requirement: REQ });
  const reordered = { buildingType: "apartment", preferred_locations: [{ city: "new cairo" }], max_price: 5_000_000 };
  assert.equal(await buyRequestSubmitKey({ phone: "+20 100 000 0001", name: " Ali ", requirement: reordered }), key);
  assert.equal(await buyRequestSubmitKey({ phone: "20-100-000-0001", name: "Ali", requirement: REQ }), key);
});

test("an edited requirement, place, name or sender gives another key", async () => {
  const key = await buyRequestSubmitKey({ phone: PHONE, name: "Ali", requirement: REQ });
  assert.notEqual(await buyRequestSubmitKey({ phone: PHONE, name: "Ali", requirement: { ...REQ, max_price: 6_000_000 } }), key);
  assert.notEqual(
    await buyRequestSubmitKey({ phone: PHONE, name: "Ali", requirement: { ...REQ, preferred_locations: [{ city: "cairo" }] } }),
    key,
  );
  assert.notEqual(await buyRequestSubmitKey({ phone: PHONE, name: "Omar", requirement: REQ }), key);
  assert.notEqual(await buyRequestSubmitKey({ phone: OTHER_PHONE, name: "Ali", requirement: REQ }), key);
});

test("an edit of a saved request is keyed by its user id, without a phone", async () => {
  const key = await buyRequestSubmitKey({ userId: "u1", requirement: REQ });
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(await buyRequestSubmitKey({ userId: "u1", requirement: { ...REQ } }), key);
  assert.notEqual(await buyRequestSubmitKey({ userId: "u1", requirement: { ...REQ, max_price: 1 } }), key);
  assert.notEqual(await buyRequestSubmitKey({ userId: "u2", requirement: REQ }), key);
});

test("no sender identity gives no key", async () => {
  assert.equal(await buyRequestSubmitKey({ requirement: REQ }), "");
  assert.equal(await buyRequestSubmitKey({ phone: "abc", requirement: REQ }), "");
});

test("canonicalJson sorts keys and skips undefined", () => {
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: undefined }] }), '{"a":[2,{"d":1}],"b":1}');
});

test("only a request created by this submit is an ads conversion", () => {
  assert.equal(isNewBuyRequestConversion({ isEdit: false, repeated: false }), true);
  assert.equal(isNewBuyRequestConversion({ isEdit: true, repeated: false }), false);
  assert.equal(isNewBuyRequestConversion({ isEdit: false, repeated: true }), false);
});

test("same key inside the window is a repeat", () => {
  const record = { key: "k1", userId: "u1", at: 1_000 };
  assert.equal(findRepeatSubmit(record, "k1", 1_000), record);
  assert.equal(findRepeatSubmit(record, "k1", 1_000 + REPEAT_WINDOW_MS - 1), record);
});

test("the window closes at five minutes", () => {
  assert.equal(REPEAT_WINDOW_MS, 5 * 60 * 1000);
  const record = { key: "k1", userId: "u1", at: 1_000 };
  assert.equal(findRepeatSubmit(record, "k1", 1_000 + REPEAT_WINDOW_MS), null);
});

test("another phone, no key, or a broken record is not a repeat", () => {
  const record = { key: "k1", userId: "u1", at: 1_000 };
  assert.equal(findRepeatSubmit(record, "k2", 1_500), null);
  assert.equal(findRepeatSubmit(record, "", 1_500), null);
  assert.equal(findRepeatSubmit(null, "k1", 1_500), null);
  assert.equal(findRepeatSubmit({ key: "k1" }, "k1", 1_500), null);
  assert.equal(findRepeatSubmit({ key: "k1", at: "soon" }, "k1", 1_500), null);
  // A record dated in the future (clock change) never blocks a submit.
  assert.equal(findRepeatSubmit({ key: "k1", at: 9_000 }, "k1", 1_500), null);
});

test("storage keeps the key, user id and time — never the phone", async () => {
  const store = fakeBrowser();
  const key = await buyRequestSubmitKey({ phone: PHONE, requirement: REQ });
  saveLastBuyRequestSubmit({ key, userId: "u1" }, 5_000);

  assert.deepEqual(readLastBuyRequestSubmit(), {
    key,
    userId: "u1",
    matchRef: "",
    at: 5_000,
  });
  const stored = [...store.values()].join("");
  assert.ok(!stored.includes("201000000001"));

  assert.equal(findRepeatSubmit(readLastBuyRequestSubmit(), key, 6_000).userId, "u1");
  const otherKey = await buyRequestSubmitKey({ phone: OTHER_PHONE, requirement: REQ });
  assert.equal(findRepeatSubmit(readLastBuyRequestSubmit(), otherKey, 6_000), null);
});

test("nothing is stored without a key", () => {
  const store = fakeBrowser();
  saveLastBuyRequestSubmit({ key: "", userId: "u1" });
  assert.equal(store.size, 0);
  assert.equal(readLastBuyRequestSubmit(), null);
});

test("a repeat submit still has the request reference for the WhatsApp message", async () => {
  fakeBrowser();
  const key = await buyRequestSubmitKey({ phone: PHONE, requirement: REQ });
  saveLastBuyRequestSubmit({ key, userId: "u1", matchRef: "K7Q2M9XD" }, 5_000);

  assert.equal(
    findRepeatSubmit(readLastBuyRequestSubmit(), key, 6_000).matchRef,
    "K7Q2M9XD",
  );
});
