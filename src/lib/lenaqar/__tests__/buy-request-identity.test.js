/**
 * Saved proof of ownership and contact hint of a buy request. Run with:
 * node --test src/lib/lenaqar/__tests__/buy-request-identity.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  MATCH_REF_STORAGE_KEY,
  clearMatchRef,
  contactHintFrom,
  readContactHint,
  readMatchRef,
  writeMatchRef,
} from "../buy-request-identity.js";

function fakeStorage() {
  const store = new Map();
  return {
    store,
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

// Made-up contact, not a real person.
const CONTACT = { name: "  Ali   Test ", phone: "+201000000678" };

test("the hint keeps the name and only the last three digits of the phone", () => {
  assert.deepEqual(contactHintFrom(CONTACT), { name: "Ali Test", phoneTail: "678" });
  assert.equal(contactHintFrom({}), null);
  assert.equal(contactHintFrom({ name: "", phone: "12" }), null);
  assert.deepEqual(contactHintFrom({ name: "Ali" }), { name: "Ali", phoneTail: "" });
  assert.equal(contactHintFrom({ name: "x".repeat(80) }).name.length, 40);
});

test("the proof and hint are stored for one user and the full phone is not", () => {
  const storage = fakeStorage();
  writeMatchRef(storage, "u1", "ABCD2345", CONTACT);
  assert.equal(readMatchRef(storage, "u1"), "ABCD2345");
  assert.deepEqual(readContactHint(storage, "u1"), { name: "Ali Test", phoneTail: "678" });
  assert.ok(!storage.store.get(MATCH_REF_STORAGE_KEY).includes("201000000678"));
  // Another user does not get it.
  assert.equal(readMatchRef(storage, "u2"), "");
  assert.equal(readContactHint(storage, "u2"), null);
});

test("an edit without contact keeps the hint of the same user", () => {
  const storage = fakeStorage();
  writeMatchRef(storage, "u1", "ABCD2345", CONTACT);
  writeMatchRef(storage, "u1", "ABCD2345");
  assert.deepEqual(readContactHint(storage, "u1"), { name: "Ali Test", phoneTail: "678" });
});

test("a different user does not inherit the previous hint", () => {
  const storage = fakeStorage();
  writeMatchRef(storage, "u1", "ABCD2345", CONTACT);
  writeMatchRef(storage, "u2", "ZZZZ9999");
  assert.equal(readContactHint(storage, "u2"), null);
  assert.equal(readMatchRef(storage, "u1"), "");
});

test("a new contact replaces the saved hint", () => {
  const storage = fakeStorage();
  writeMatchRef(storage, "u1", "ABCD2345", CONTACT);
  writeMatchRef(storage, "u1", "ABCD2345", { name: "Omar", phone: "+201000000111" });
  assert.deepEqual(readContactHint(storage, "u1"), { name: "Omar", phoneTail: "111" });
});

test("clear removes the proof and the hint", () => {
  const storage = fakeStorage();
  writeMatchRef(storage, "u1", "ABCD2345", CONTACT);
  clearMatchRef(storage);
  assert.equal(readMatchRef(storage, "u1"), "");
  assert.equal(readContactHint(storage, "u1"), null);
});

test("missing storage, broken JSON and missing ids are harmless", () => {
  assert.equal(readMatchRef(null, "u1"), "");
  assert.equal(readContactHint(null, "u1"), null);
  writeMatchRef(null, "u1", "ABCD2345");
  clearMatchRef(null);
  const storage = fakeStorage();
  storage.store.set(MATCH_REF_STORAGE_KEY, "{not json");
  assert.equal(readMatchRef(storage, "u1"), "");
  assert.equal(readContactHint(storage, "u1"), null);
  writeMatchRef(storage, "", "ABCD2345");
  writeMatchRef(storage, "u1", "");
  assert.equal(storage.store.get(MATCH_REF_STORAGE_KEY), "{not json");
});
