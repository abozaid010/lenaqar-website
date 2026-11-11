import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buyerPageCtaMessage,
  matchRequestMessage,
  normalizeMatchRef,
} from "../whatsapp-intent.js";

test("buyer footer message carries listing attribution on property detail routes", () => {
  assert.match(buyerPageCtaMessage("/opportunities/MguPxCF0"), /OPP-MGUPXCF0$/);
  assert.match(buyerPageCtaMessage("/opportunities/OPP-MguPxCF0"), /OPP-MGUPXCF0$/);
});

test("buyer footer message carries a stable page code on guide routes without personal data", () => {
  const message = buyerPageCtaMessage("/guides/madinaty/prices-2026");
  assert.match(message, /PAGE-GUIDES$/);
  assert.doesNotMatch(message, /\+?\d{8,}|@/);
});

test("home footer message defaults to buyer intent", () => {
  assert.match(buyerPageCtaMessage("/"), /فرص الشراء.*PAGE-HOME$/);
});

test("match request message is the fixed opener the backend recognises", () => {
  const message = matchRequestMessage();
  assert.equal(
    message,
    "مرحبا لينا عقار، عايز أشوف الوحدات المناسبة لطلبي — MATCH",
  );
  assert.match(message, /— MATCH$/);
});

test("match request message carries no user data", () => {
  // The sender's WhatsApp number is the identity; the text names no request.
  assert.doesNotMatch(matchRequestMessage(), /\d|@/);
});

test("match request message carries the request reference the backend returned", () => {
  assert.equal(
    matchRequestMessage("K7Q2M9XD"),
    "مرحبا لينا عقار، عايز أشوف الوحدات المناسبة لطلبي — MATCH-K7Q2M9XD",
  );
  assert.match(matchRequestMessage(" k7q2m9xd "), /— MATCH-K7Q2M9XD$/);
});

test("anything that is not a well-formed reference is left out of the message", () => {
  const plain = "مرحبا لينا عقار، عايز أشوف الوحدات المناسبة لطلبي — MATCH";
  for (const bad of [
    "",
    null,
    undefined,
    42,
    "K7Q2",
    "K7Q2M9XD9",
    "K7Q2M9X0", // 0 is not in the reference alphabet
    "K7Q2 M9XD",
    "+201000000001",
    "<script>",
  ]) {
    assert.equal(matchRequestMessage(bad), plain, String(bad));
    assert.equal(normalizeMatchRef(bad), "", String(bad));
  }
});

test("a reference is normalised to upper case", () => {
  assert.equal(normalizeMatchRef("k7q2m9xd"), "K7Q2M9XD");
});
