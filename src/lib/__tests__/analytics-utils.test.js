import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cashBucket,
  classifyWhatsAppHref,
  getPageType,
  sanitizeParams,
} from "../analytics-utils.js";

const own = { buyer: "201002891933", network: "201016080323" };

test("getPageType maps routes", () => {
  assert.equal(getPageType("/"), "home");
  assert.equal(getPageType("/opportunities"), "opportunities_list");
  assert.equal(getPageType("/opportunities/ABC-1"), "opportunity_detail");
  assert.equal(getPageType("/sell/"), "sell");
  assert.equal(getPageType("/guides/new-cairo/x"), "guide");
  assert.equal(getPageType("/network/signup"), "network");
  assert.equal(getPageType("/apartments-for-sale/madinaty"), "buyer_landing");
  assert.equal(getPageType("/villas-for-sale/egypt"), "buyer_landing");
  assert.equal(getPageType("/ready-to-move-properties"), "buyer_landing");
  assert.equal(getPageType("/no-calls"), "door_landing");
  assert.equal(getPageType("/whatever"), "other");
  assert.equal(getPageType(undefined), "home");
});

test("classifyWhatsAppHref separates contact, share and non-WhatsApp", () => {
  assert.equal(classifyWhatsAppHref("https://example.com/x", own), null);
  assert.equal(classifyWhatsAppHref("tel:+201002891933", own), null);
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/?text=hello", own), { kind: "share" });
  assert.deepEqual(classifyWhatsAppHref("https://api.whatsapp.com/send?text=hi", own), {
    kind: "share",
  });
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/201002891933?text=%D9%85", own), {
    kind: "contact",
    target: "buyer",
  });
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/201016080323", own), {
    kind: "contact",
    target: "network",
  });
  assert.deepEqual(classifyWhatsAppHref("https://api.whatsapp.com/send?phone=201002891933", own), {
    kind: "contact",
    target: "buyer",
  });
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/15551234567", own), {
    kind: "contact",
    target: "other",
  });
});

test("sanitizeParams strips PII keys and empty values, caps length", () => {
  const out = sanitizeParams({
    cta_intent: "buy",
    phone: "0100",
    email: "a@b.c",
    unit_code: "",
    n: 3,
    ok: false,
    long: "x".repeat(300),
    skip: undefined,
  });
  assert.deepEqual(Object.keys(out).sort(), ["cta_intent", "long", "n", "ok"]);
  assert.equal(out.long.length, 100);
});

test("cashBucket", () => {
  assert.equal(cashBucket(""), "none");
  assert.equal(cashBucket("abc"), "none");
  assert.equal(cashBucket(499_999), "lt_500k");
  assert.equal(cashBucket(500_000), "500k_1m");
  assert.equal(cashBucket("1500000"), "1m_2m");
  assert.equal(cashBucket(2_000_000), "2m_5m");
  assert.equal(cashBucket(9_000_000), "gte_5m");
});
