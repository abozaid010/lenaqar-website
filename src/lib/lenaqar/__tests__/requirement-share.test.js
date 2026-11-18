/** Run with: node --test src/lib/lenaqar/__tests__/requirement-share.test.js */
import test from "node:test";
import assert from "node:assert/strict";
import {
  isPublicRequirementId,
  requirementShareUrl,
  whatsappShareHref,
} from "../requirement-public.js";
import { readMatchRef, writeMatchRef, MATCH_REF_STORAGE_KEY } from "../buy-request-identity.js";

test("one canonical request link from the public id", () => {
  assert.equal(
    requirementShareUrl("a1b2c3d4e5f6", "https://www.lenaqar.com/"),
    "https://www.lenaqar.com/requests/a1b2c3d4e5f6"
  );
  assert.equal(isPublicRequirementId("a1b2c3d4e5f6"), true);
  for (const bad of ["A1B2C3D4E5F6", "a1b2c3", "a1b2c3d4e5f6/x", null, 12]) {
    assert.equal(isPublicRequirementId(bad), false);
  }
});

test("WhatsApp share carries text and link with no recipient", () => {
  const href = whatsappShareHref("مشتري بيدور على: شقة", "https://www.lenaqar.com/requests/a1b2c3d4e5f6");
  assert.ok(href.startsWith("https://wa.me/?text="));
  assert.equal(
    decodeURIComponent(href.split("text=")[1]),
    "مشتري بيدور على: شقة\nhttps://www.lenaqar.com/requests/a1b2c3d4e5f6"
  );
});

test("match ref is stored with its user and only read back for that user", () => {
  const values = new Map();
  const storage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  assert.equal(readMatchRef(storage, "u1"), "");
  writeMatchRef(storage, "u1", "K7Q2M9XD");
  assert.equal(readMatchRef(storage, "u1"), "K7Q2M9XD");
  assert.equal(readMatchRef(storage, "u2"), "");
  values.set(MATCH_REF_STORAGE_KEY, "not json");
  assert.equal(readMatchRef(storage, "u1"), "");
  writeMatchRef(storage, "u1", "");
  assert.equal(values.get(MATCH_REF_STORAGE_KEY), "not json");
});
