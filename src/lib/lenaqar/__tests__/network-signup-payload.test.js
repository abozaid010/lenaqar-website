/**
 * Lena Network public signup payload.
 * Run with: node --test src/lib/lenaqar/__tests__/network-signup-payload.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { buildNetworkSignupPayload } from "../network-signup-payload.js";
import {
  mapNetworkLoginStatus,
  mapNetworkSignupStatus,
} from "../network-auth-errors.js";
import {
  composeNetworkActivationMessage,
  composeNetworkSignupWhatsAppMessage,
  hasCompleteNetworkSignupSnapshot,
  networkActivationHref,
  shouldFallbackNetworkSignupToWhatsApp,
  toNetworkSignupSnapshot,
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

const NETWORK_WHATSAPP_DIGITS =
  LENAQAR_CONTACT.networkActivationWhatsappE164.replace(/\D/g, "");
const GLOBAL_WHATSAPP_DIGITS = LENAQAR_CONTACT.whatsappE164.replace(/\D/g, "");

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

test("network signup WhatsApp uses dedicated recipient, not global number", () => {
  assert.equal(
    LENAQAR_CONTACT.networkActivationWhatsappE164,
    "+201016080323",
  );
  assert.notEqual(
    LENAQAR_CONTACT.networkActivationWhatsappE164,
    LENAQAR_CONTACT.whatsappE164,
  );

  const message = composeNetworkActivationMessage("Ahmed Broker", {
    withName: "I'm {name}, and I want to activate my account.",
    withoutName: "I want to activate my account on Lena Network.",
  });
  assert.equal(message, "I'm Ahmed Broker, and I want to activate my account.");
  const href = networkActivationHref(message);
  assert.equal(href.startsWith(`https://wa.me/${NETWORK_WHATSAPP_DIGITS}?text=`), true);
  assert.equal(href.includes(GLOBAL_WHATSAPP_DIGITS), false);
  assert.equal(decodeURIComponent(href).includes("Ahmed Broker"), true);
});

test("activation WhatsApp falls back when name is missing", () => {
  const message = composeNetworkActivationMessage("  ", {
    withName: "I'm {name}, and I want to activate my account.",
    withoutName: "I want to activate my account on Lena Network.",
  });
  assert.equal(message, "I want to activate my account on Lena Network.");
});

test("complete signup WhatsApp payload includes all fields except password", () => {
  const snapshot = toNetworkSignupSnapshot(validInput);
  assert.equal("password" in snapshot, false);
  assert.equal(hasCompleteNetworkSignupSnapshot(snapshot), true);

  const message = composeNetworkSignupWhatsAppMessage({
    form: snapshot,
    intro: "I want to join Lena Network. Here are my application details:",
    labels: {
      clientName: "Company name",
      fullName: "Full name",
      email: "Email",
      phone: "Mobile",
      logo: "Company logo",
    },
  });

  assert.match(message, /Company name: Horizon Realty/);
  assert.match(message, /Full name: Ahmed Broker/);
  assert.match(message, /Email: broker@example\.com/);
  assert.match(message, /Mobile: \+201012345678/);
  assert.match(message, /Company logo: https:\/\/api\.lenaai\.net\/gcs\/logo\.webp/);
  assert.equal(message.includes("secret12"), false);
  assert.equal(message.toLowerCase().includes("password"), false);

  const href = networkActivationHref(message);
  assert.equal(href.startsWith(`https://wa.me/${NETWORK_WHATSAPP_DIGITS}?text=`), true);
  assert.equal(href.includes(GLOBAL_WHATSAPP_DIGITS), false);
});

test("incomplete signup snapshot is rejected for WhatsApp completeness", () => {
  assert.equal(
    hasCompleteNetworkSignupSnapshot({
      client_name: "Horizon",
      full_name: "",
      email: "a@b.com",
      phone_number: "+201012345678",
    }),
    false,
  );
});

test("WhatsApp fallback only for HTTP failures, not email_taken", () => {
  assert.equal(shouldFallbackNetworkSignupToWhatsApp("save_failed"), true);
  assert.equal(shouldFallbackNetworkSignupToWhatsApp("validation_failed"), true);
  assert.equal(shouldFallbackNetworkSignupToWhatsApp("rate_limited"), true);
  assert.equal(shouldFallbackNetworkSignupToWhatsApp("email_taken"), false);
  assert.equal(shouldFallbackNetworkSignupToWhatsApp(undefined), false);
});

test("backend signup module does not send WhatsApp (frontend-only messaging)", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const serverSource = readFileSync(
    join(here, "../network-auth.server.js"),
    "utf8",
  );
  assert.match(serverSource, /\/client\/signup/);
  assert.match(serverSource, /never sends WhatsApp/i);
  // No WhatsApp API / deep-link side effects — comments may mention WhatsApp.
  assert.equal(/wa\.me|openWhatsApp|send_messages|formatPhoneForWhatsApp/i.test(serverSource), false);
  assert.equal(/from ["'][^"']*whatsapp/i.test(serverSource), false);
});
