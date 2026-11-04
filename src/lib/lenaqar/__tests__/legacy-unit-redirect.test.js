import test from "node:test";
import assert from "node:assert/strict";
import {
  isLegacyUnitId,
  legacyCodeCandidate,
  legacyUnitIdFromParam,
  opportunityPath,
  resolveLegacyUnit,
} from "../legacy-unit-redirect.js";

const UUID = "4b8bc693-a9cd-4f98-804f-cc3aa2ed2549";

function fakeApi({ ids = {}, codes = {}, failIds = false, failCodes = false } = {}) {
  const calls = { byId: [], byCode: [] };
  return {
    calls,
    byId: async (id) => {
      calls.byId.push(id);
      if (failIds) return { ok: false, status: 503 };
      return ids[id] ? { ok: true, status: 200, data: { code: ids[id] } } : { ok: false, status: 404 };
    },
    byCode: async (code) => {
      calls.byCode.push(code);
      if (failCodes) return { ok: false, status: 500 };
      return codes[code] ? { ok: true, status: 200, data: { code: codes[code] } } : { ok: false, status: 404 };
    },
  };
}

test("recognises the legacy unit id shapes", () => {
  assert.ok(isLegacyUnitId(UUID));
  assert.ok(isLegacyUnitId("65a1b2c3d4e5f6a7b8c9d0e1"));
  assert.ok(isLegacyUnitId("12345"));
  assert.ok(isLegacyUnitId("homey_ab12"));
  assert.ok(!isLegacyUnitId("kBqU7H1A"));
  assert.ok(!isLegacyUnitId(""));
});

test("extracts the unit id from an old SEO slug and from a bare id", () => {
  assert.equal(legacyUnitIdFromParam(`shqa-ghrftyn--u-${UUID}`), UUID);
  assert.equal(legacyUnitIdFromParam(encodeURIComponent(`شقة-غرفتين--u-${UUID}`)), UUID);
  assert.equal(legacyUnitIdFromParam(`${UUID}/`), UUID);
  assert.equal(legacyUnitIdFromParam("shqa--u-not an id"), null);
  assert.equal(legacyUnitIdFromParam("kBqU7H1A"), null);
});

test("code candidates are decoded, bounded and never slugs", () => {
  assert.equal(legacyCodeCandidate("kBqU7H1A"), "kBqU7H1A");
  assert.equal(legacyCodeCandidate("63%2F50%2F13"), "63/50/13");
  assert.equal(legacyCodeCandidate("x".repeat(65)), null);
  assert.equal(legacyCodeCandidate("../etc"), null);
  assert.equal(legacyCodeCandidate(`a--u-${UUID}`), null);
});

test("opportunity path encodes unusual codes", () => {
  assert.equal(opportunityPath("kBqU7H1A"), "/opportunities/kBqU7H1A");
  assert.equal(opportunityPath("63/50/13"), "/opportunities/63%2F50%2F13");
});

test("legacy id redirects to the public opportunity code", async () => {
  const api = fakeApi({ ids: { [UUID]: "kBqU7H1A" } });
  assert.deepEqual(await resolveLegacyUnit(UUID, api), {
    kind: "redirect",
    location: "/opportunities/kBqU7H1A",
  });
  assert.deepEqual(api.calls.byCode, []);
});

test("/unit slug with an embedded id redirects", async () => {
  const api = fakeApi({ ids: { [UUID]: "kBqU7H1A" } });
  const outcome = await resolveLegacyUnit(`shqa--u-${UUID}`, api, { allowCode: true });
  assert.equal(outcome.location, "/opportunities/kBqU7H1A");
});

test("/unit with a bare code falls back to the code lookup", async () => {
  const api = fakeApi({ codes: { kBqU7H1A: "kBqU7H1A" } });
  const outcome = await resolveLegacyUnit("kBqU7H1A", api, { allowCode: true });
  assert.equal(outcome.location, "/opportunities/kBqU7H1A");
});

test("/properties never treats a non-id token as a code", async () => {
  const api = fakeApi({ codes: { kBqU7H1A: "kBqU7H1A" } });
  assert.deepEqual(await resolveLegacyUnit("kBqU7H1A", api), { kind: "not_found" });
  assert.deepEqual(api.calls.byCode, []);
});

test("unknown unit is not_found, not a redirect to a guessed page", async () => {
  const api = fakeApi();
  assert.deepEqual(await resolveLegacyUnit(UUID, api, { allowCode: true }), { kind: "not_found" });
});

test("upstream failure is unavailable so crawlers retry instead of dropping the URL", async () => {
  assert.deepEqual(await resolveLegacyUnit(UUID, fakeApi({ failIds: true })), { kind: "unavailable" });
  assert.deepEqual(
    await resolveLegacyUnit("kBqU7H1A", fakeApi({ failCodes: true }), { allowCode: true }),
    { kind: "unavailable" },
  );
});

test("a later successful lookup wins over an earlier upstream failure", async () => {
  const api = fakeApi({ failIds: true, codes: { "12345": "kBqU7H1A" } });
  const outcome = await resolveLegacyUnit("12345", api, { allowCode: true });
  assert.equal(outcome.location, "/opportunities/kBqU7H1A");
});
