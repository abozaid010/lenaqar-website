import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatEgp,
  formatIsoDate,
  formatRoiPercent,
} from "../../lib/market-index/format.js";

describe("market-index format helpers", () => {
  it("formats EGP with western thousands separators", () => {
    assert.equal(formatEgp(3560000), "3,560,000 EGP");
    assert.equal(formatEgp(null), null);
  });

  it("formats ROI fractions as percent", () => {
    assert.equal(formatRoiPercent(0.0675), "6.75%");
    assert.equal(formatRoiPercent(null), null);
  });

  it("formats ISO dates", () => {
    const out = formatIsoDate("2026-07-19T20:49:45.623131+00:00");
    assert.ok(out && out.includes("2026"));
  });
});
