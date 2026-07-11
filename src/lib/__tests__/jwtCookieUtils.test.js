/**
 * Unit tests for JWT cookie helpers.
 * Run with: node --test src/lib/__tests__/jwtCookieUtils.test.js
 *
 * decodeJwtClientId feeds the `x-client-id` header the BFF proxy now sends on
 * every authenticated call. It must match how the server-RSC profile fetch
 * scopes the client, otherwise browser-originated profile reads resolve a
 * different client context (the WhatsApp-accounts-vanish / deep-link bug).
 */
import test from "node:test";
import assert from "node:assert/strict";

import { decodeJwtClientId } from "../jwtCookieUtils.js";

/** Build an unsigned JWT (header.payload.signature) with the given payload. */
function makeJwt(payload) {
  const b64url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.sig`;
}

test("decodeJwtClientId reads client_id from a valid token", () => {
  const token = makeJwt({ client_id: "public", sub: "u1" });
  assert.equal(decodeJwtClientId(token), "public");
});

test("decodeJwtClientId returns null when client_id is missing", () => {
  assert.equal(decodeJwtClientId(makeJwt({ sub: "u1" })), null);
});

test("decodeJwtClientId returns null when client_id is not a string", () => {
  assert.equal(decodeJwtClientId(makeJwt({ client_id: 123 })), null);
});

test("decodeJwtClientId returns null for malformed / empty input", () => {
  assert.equal(decodeJwtClientId(""), null);
  assert.equal(decodeJwtClientId(null), null);
  assert.equal(decodeJwtClientId("not-a-jwt"), null);
  assert.equal(decodeJwtClientId("only.two"), null);
});
