import { test } from "node:test";
import assert from "node:assert/strict";
import { buyerPageCtaMessage, matchRequestMessage } from "../whatsapp-intent.js";

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
