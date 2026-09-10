/**
 * Lena Network public signup payload.
 * Run with: node --test src/lib/lenaqar/__tests__/network-signup-payload.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import { buildNetworkSignupPayload } from "../network-signup-payload.js";
import {
  mapNetworkLoginStatus,
  mapNetworkSignupStatus,
} from "../network-auth-errors.js";
import {
  composeNetworkActivationMessage,
  networkActivationHref,
} from "../network-activation.js";
import { LENAQAR_CONTACT } from "../../../config/lenaqar-contact.js";

const validInput = {
  client_name: "Horizon Realty",
  full_name: "Ahmed Broker",
  email: "broker@example.com",
  password: "secret12",
  phone_number: "+201012345678",
  logo_url: "https://api.lenaai.net/gcs/logo.webp",
  client_id: "must-not-be-sent",
  is_active: true,
  price_percentage: 5,
};

test("sends exactly the six contract fields", () => {
  const result = buildNetworkSignupPayload(validInput);
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.payload).sort(), [
    "client_name",
    "email",
    "full_name",
    "logo_url",
    "password",
    "phone_number",
  ]);
});

test("never sends client_id or is_active even if supplied", () => {
  const result = buildNetworkSignupPayload(validInput);
  assert.equal(result.ok, true);
  assert.equal("client_id" in result.payload, false);
  assert.equal("is_active" in result.payload, false);
  assert.equal(result.payload.client_name, "Horizon Realty");
  assert.equal(result.payload.phone_number, "+201012345678");
});

test("requires phone_number", () => {
  const result = buildNetworkSignupPayload({
    ...validInput,
    phone_number: "  ",
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.phone_number, "phoneRequired");
});

test("allows empty logo_url", () => {
  const result = buildNetworkSignupPayload({ ...validInput, logo_url: "" });
  assert.equal(result.ok, true);
  assert.equal(result.payload.logo_url, "");
});

test("login 403 inactive is pending, not invalid credentials", () => {
  assert.equal(
    mapNetworkLoginStatus(403, "Account is inactive"),
    "pending",
  );
  assert.equal(mapNetworkLoginStatus(401, "Account is inactive"), "invalid_credentials");
  assert.equal(mapNetworkLoginStatus(401, "Unauthorized"), "invalid_credentials");
});

test("signup duplicate email maps to email_taken", () => {
  assert.equal(mapNetworkSignupStatus(409, "email already exists"), "email_taken");
  assert.equal(mapNetworkSignupStatus(400, "Email already registered"), "email_taken");
});

test("activation WhatsApp uses dedicated number and named message", () => {
  const message = composeNetworkActivationMessage("Ahmed Broker", {
    withName: "I'm {name}, and I want to activate my account.",
    withoutName: "I want to activate my account on Lena Network.",
  });
  assert.equal(message, "I'm Ahmed Broker, and I want to activate my account.");
  const href = networkActivationHref(message);
  const whatsappDigits = LENAQAR_CONTACT.whatsappE164.replace(/\D/g, "");
  assert.equal(href.startsWith(`https://wa.me/${whatsappDigits}?text=`), true);
  assert.equal(decodeURIComponent(href).includes("Ahmed Broker"), true);
});

test("activation WhatsApp falls back when name is missing", () => {
  const message = composeNetworkActivationMessage("  ", {
    withName: "I'm {name}, and I want to activate my account.",
    withoutName: "I want to activate my account on Lena Network.",
  });
  assert.equal(message, "I want to activate my account on Lena Network.");
});
