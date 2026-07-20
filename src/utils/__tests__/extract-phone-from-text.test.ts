/**
 * Run: node --experimental-strip-types --test src/utils/__tests__/extract-phone-from-text.test.ts
 * (or via tsx if available)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractPhoneFromText } from "../extract-phone-from-text.ts";

describe("extractPhoneFromText", () => {
  it("extracts plain Egyptian local number", () => {
    const text = `متاح شقه للايجار قانون
137 متر
مطلوب 18 الف
01027450274`;
    assert.equal(extractPhoneFromText(text), "+201027450274");
  });

  it("extracts +20 international format", () => {
    assert.equal(extractPhoneFromText("Call +201027450274 now"), "+201027450274");
  });

  it("extracts 20… without plus", () => {
    assert.equal(extractPhoneFromText("201027450274"), "+201027450274");
  });

  it("extracts wa.me links", () => {
    assert.equal(
      extractPhoneFromText("https://wa.me/201027450274"),
      "+201027450274",
    );
  });

  it("extracts api.whatsapp.com links", () => {
    assert.equal(
      extractPhoneFromText(
        "https://api.whatsapp.com/send?phone=201027450274",
      ),
      "+201027450274",
    );
  });

  it("extracts spaced numbers", () => {
    assert.equal(extractPhoneFromText("Call me:\n0102 745 0274"), "+201027450274");
  });

  it("extracts dashed numbers", () => {
    assert.equal(extractPhoneFromText("0102-745-0274"), "+201027450274");
  });

  it("ignores short invalid numbers", () => {
    assert.equal(extractPhoneFromText("area 137 meter price 18k"), null);
  });

  it("returns null for empty", () => {
    assert.equal(extractPhoneFromText(""), null);
    assert.equal(extractPhoneFromText(null), null);
  });
});
