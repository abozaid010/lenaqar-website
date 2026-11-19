/**
 * Public error codes of the buy-request calls. Run with:
 * node --test src/lib/lenaqar/__tests__/buy-request-errors.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { publicErrorCode } from "../buy-request-errors.js";

const failure = (status, data) => ({ response: { status, data } });

test("429 is rate limited", () => {
  assert.equal(publicErrorCode(failure(429, {}), "save_failed"), "rate_limited");
});

test("the backend asking for name and phone is contact_required, in either error shape", () => {
  const text = "name and phone are required to create a dashboard buy lead";
  assert.equal(publicErrorCode(failure(400, { detail: text }), "save_failed"), "contact_required");
  assert.equal(
    publicErrorCode(failure(400, { status: false, code: 400, error_message: text }), "save_failed"),
    "contact_required",
  );
});

test("any other failure keeps the fallback code", () => {
  assert.equal(publicErrorCode(failure(400, { detail: "bad budget" }), "save_failed"), "save_failed");
  assert.equal(publicErrorCode(failure(500, {}), "load_failed"), "load_failed");
  assert.equal(publicErrorCode(new Error("network"), "save_failed"), "save_failed");
  assert.equal(publicErrorCode(undefined, "save_failed"), "save_failed");
});
