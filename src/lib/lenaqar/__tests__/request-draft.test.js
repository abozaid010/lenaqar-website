/**
 * Unsaved request draft. Run with:
 * node --test src/lib/lenaqar/__tests__/request-draft.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { REQUEST_DRAFT_KEY, clearDraft, cleanDraft, readDraft, writeDraft } from "../request-draft.js";

function fakeStorage() {
  const store = new Map();
  return {
    store,
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

const DRAFT = {
  form: {
    notes: "عايز شقة قريبة من الخدمات",
    buildingType: "apartment",
    max_price: "5000000",
    places: [{ city: "new cairo" }, { city: "cairo" }],
  },
  contactName: "Ali",
  phoneNumber: "+201000000001",
};

test("a draft is saved and read back", () => {
  const storage = fakeStorage();
  writeDraft(storage, DRAFT);
  assert.deepEqual(readDraft(storage), {
    form: {
      buildingType: "apartment",
      max_price: "5000000",
      notes: "عايز شقة قريبة من الخدمات",
      places: [{ city: "new cairo" }, { city: "cairo" }],
    },
    contactName: "Ali",
    phoneNumber: "+201000000001",
  });
});

test("an empty draft removes what was saved", () => {
  const storage = fakeStorage();
  writeDraft(storage, DRAFT);
  writeDraft(storage, { form: { notes: "   " }, contactName: " ", phoneNumber: "" });
  assert.equal(storage.store.has(REQUEST_DRAFT_KEY), false);
  assert.equal(readDraft(storage), null);
});

test("clear removes the draft", () => {
  const storage = fakeStorage();
  writeDraft(storage, DRAFT);
  clearDraft(storage);
  assert.equal(readDraft(storage), null);
});

test("only known fields survive, with sane types and lengths", () => {
  const clean = cleanDraft({
    form: {
      max_price: 5000000,
      buildingType: "villa",
      secret: "x",
      notes: "n".repeat(5000),
      places: [{ city: "cairo" }, { nope: true }, "text"],
    },
    contactName: "x".repeat(200),
    phoneNumber: 12345,
  });
  assert.equal(clean.form.max_price, undefined);
  assert.equal(clean.form.secret, undefined);
  assert.equal(clean.form.buildingType, "villa");
  assert.equal(clean.form.notes.length, 2000);
  assert.deepEqual(clean.form.places, [{ city: "cairo" }]);
  assert.equal(clean.contactName.length, 80);
  assert.equal(clean.phoneNumber, "");
});

test("a place inside a selected city is dropped, like the form does", () => {
  const clean = cleanDraft({
    form: { places: [{ city: "new cairo" }, { city: "new cairo", district: "madinaty" }] },
  });
  assert.deepEqual(clean.form.places, [{ city: "new cairo" }]);
});

test("missing storage, broken JSON and junk are harmless", () => {
  assert.equal(readDraft(null), null);
  writeDraft(null, DRAFT);
  clearDraft(null);
  const storage = fakeStorage();
  storage.store.set(REQUEST_DRAFT_KEY, "{not json");
  assert.equal(readDraft(storage), null);
  assert.equal(cleanDraft(null), null);
  assert.equal(cleanDraft("x"), null);
  assert.equal(cleanDraft({}), null);
});
