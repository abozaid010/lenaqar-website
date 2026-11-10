/**
 * Buy-request repeat-submit guard. Run with:
 * node --test src/lib/lenaqar/__tests__/buy-request-repeat.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  REPEAT_WINDOW_MS,
  buyRequestRepeatKey,
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

test("key is a SHA-256 hex that does not contain the phone", async () => {
  const key = await buyRequestRepeatKey(PHONE);
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.ok(!key.includes("201000000001"));
});

test("key is the same for the same digits whatever the formatting", async () => {
  const key = await buyRequestRepeatKey(PHONE);
  assert.equal(await buyRequestRepeatKey("+20 100 000 0001"), key);
  assert.equal(await buyRequestRepeatKey("20-100-000-0001"), key);
  assert.notEqual(await buyRequestRepeatKey(OTHER_PHONE), key);
});

test("no phone gives no key", async () => {
  assert.equal(await buyRequestRepeatKey(""), "");
  assert.equal(await buyRequestRepeatKey(undefined), "");
  assert.equal(await buyRequestRepeatKey("abc"), "");
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
  const key = await buyRequestRepeatKey(PHONE);
  saveLastBuyRequestSubmit({ key, userId: "u1" }, 5_000);

  assert.deepEqual(readLastBuyRequestSubmit(), { key, userId: "u1", at: 5_000 });
  const stored = [...store.values()].join("");
  assert.ok(!stored.includes("201000000001"));

  assert.equal(findRepeatSubmit(readLastBuyRequestSubmit(), key, 6_000).userId, "u1");
  const otherKey = await buyRequestRepeatKey(OTHER_PHONE);
  assert.equal(findRepeatSubmit(readLastBuyRequestSubmit(), otherKey, 6_000), null);
});

test("nothing is stored without a key", () => {
  const store = fakeBrowser();
  saveLastBuyRequestSubmit({ key: "", userId: "u1" });
  assert.equal(store.size, 0);
  assert.equal(readLastBuyRequestSubmit(), null);
});
