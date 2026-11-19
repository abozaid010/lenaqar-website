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

// Load buy-request.server.js with axios replaced (native Node cannot resolve @/ aliases).
async function loadBuyRequestServer() {
  const { readFile } = await import("node:fs/promises");
  const url = new URL("../buy-request.server.js", import.meta.url);
  const real = (path) => `export * from ${JSON.stringify(new URL(path, import.meta.url).href)};`;
  const mocks = {
    "@/utils/axiosInstance":
      "export default { post: (...a) => globalThis.__buyRequestPost(...a), get: (...a) => globalThis.__buyRequestGet(...a) };",
    "@/lib/lenaqar/buy-request-payload": real("../buy-request-payload.js"),
    "@/lib/lenaqar/attribution": real("../attribution.js"),
    "@/lib/lenaqar/whatsapp-intent": real("../whatsapp-intent.js"),
    "@/lib/lenaqar/buy-request-errors": real("../buy-request-errors.js"),
  };
  const source = (await readFile(url, "utf8")).replace(/from "([^"]+)"/g, (match, specifier) => {
    const target = mocks[specifier];
    if (!target) throw new Error(`Unmocked dependency: ${specifier}`);
    return `from ${JSON.stringify(`data:text/javascript,${encodeURIComponent(target)}`)}`;
  });
  return import(`data:text/javascript,${encodeURIComponent(source)}`);
}

test("returning-buyer submit sends the match ref with the user id, never alone", async () => {
  const posted = [];
  globalThis.__buyRequestPost = async (path, body) => {
    posted.push(body);
    return { data: { data: { user_id: body.user_id || "new-user", match_ref: "K7Q2M9XD" } } };
  };
  try {
    const { saveBuyRequestRequirement } = await loadBuyRequestServer();
    const payload = { city: "cairo", district: "new cairo", buildingType: "apartment", paymentMode: "cash", max_price: 3000000 };
    const contact = { name: "Buyer", phone: "+201000000000" };
    await saveBuyRequestRequirement({ userId: "u1", matchRef: "K7Q2M9XD", contact, payload });
    await saveBuyRequestRequirement({ userId: "u1", matchRef: "", contact, payload });
    await saveBuyRequestRequirement({ userId: "", matchRef: "K7Q2M9XD", contact, payload });
    assert.deepEqual(
      posted.map((b) => [b.user_id, b.match_ref]),
      [["u1", "K7Q2M9XD"], ["u1", undefined], [undefined, undefined]]
    );
    assert.ok(posted.every((b) => b.name === "Buyer" && b.phone === "+201000000000"));
  } finally {
    delete globalThis.__buyRequestPost;
  }
});
