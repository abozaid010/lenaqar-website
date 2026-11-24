import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buyerPageCtaMessage,
  demandOfferMessage,
  matchRequestMessage,
  normalizeMatchRef,
  unitInquiryMessage,
  withMatchRef,
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

test("a unit opener asks about the unit, then carries its code", () => {
  assert.equal(
    unitInquiryMessage({ code: "rwl5wi1v", buildingType: "apartment" }),
    "مرحبا\nعايز اعرف تفاصيل اكتر عن الشقة دى؟ — OPP-RWL5WI1V",
  );
  assert.equal(
    unitInquiryMessage({ code: "AB12", buildingType: "villa" }),
    "مرحبا\nعايز اعرف تفاصيل اكتر عن الفيلا دى؟ — OPP-AB12",
  );
  // Any other or unknown type: "the unit".
  assert.match(unitInquiryMessage({ code: "AB12", buildingType: "land" }), /عن الوحدة دى؟ — OPP-AB12$/);
  assert.match(unitInquiryMessage({ code: "AB12" }), /عن الوحدة دى؟ — OPP-AB12$/);
  // A code already written as OPP-… is not doubled.
  assert.match(unitInquiryMessage({ code: "OPP-AB12", buildingType: "apartment" }), /— OPP-AB12$/);
});

test("the code stays a standalone dash-separated code the backend can read", () => {
  const message = withMatchRef(unitInquiryMessage({ code: "RWL5WI1V", buildingType: "apartment" }), "9brr4u27");
  assert.match(message, /[—–-]\s*OPP-RWL5WI1V(?![\w-])/);
  assert.match(message, /[—–-]\s*MATCH-9BRR4U27(?![\w-])/);
  assert.ok(message.endsWith("— OPP-RWL5WI1V — MATCH-9BRR4U27"));
});

test("a unit card on the match page sends the unit code, then the request reference", () => {
  const unitOpener = unitInquiryMessage({ code: "J6YDYHAJ", buildingType: "apartment" });
  assert.equal(
    withMatchRef(unitOpener, "k7q2m9xd"),
    "مرحبا\nعايز اعرف تفاصيل اكتر عن الشقة دى؟ — OPP-J6YDYHAJ — MATCH-K7Q2M9XD",
  );
  // No clean reference: the plain unit opener, exactly as a unit page sends it.
  assert.equal(withMatchRef(unitOpener, "bad"), unitOpener);
  assert.equal(withMatchRef(unitOpener, ""), unitOpener);
});

test("demand-card opener: seller sentence, upper-case REQ code, then the request link", () => {
  assert.equal(
    demandOfferMessage("ecfd9cdc8bcc", "https://www.lenaqar.com"),
    "عندى شقة للبيع مناسبة لطلب العميل ده — REQ-ECFD9CDC8BCC\nhttps://www.lenaqar.com/requests/ecfd9cdc8bcc",
  );
});

test("demand-card opener accepts an upper-case or padded id and a trailing-slash site URL", () => {
  const expected =
    "عندى شقة للبيع مناسبة لطلب العميل ده — REQ-ECFD9CDC8BCC\nhttps://www.lenaqar.com/requests/ecfd9cdc8bcc";
  assert.equal(demandOfferMessage(" ECFD9CDC8BCC ", "https://www.lenaqar.com/"), expected);
});

test("demand-card opener without a valid public id is the sentence alone", () => {
  for (const id of [undefined, null, "", "HOME", "ecfd9cdc8bc", "ecfd9cdc8bccx", "zzzzzzzzzzzz", 123]) {
    assert.equal(demandOfferMessage(id, "https://www.lenaqar.com"), "عندى شقة للبيع مناسبة لطلب العميل ده");
  }
});
