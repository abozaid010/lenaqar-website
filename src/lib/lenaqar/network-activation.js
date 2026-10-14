import { formatPhoneForWhatsApp } from "../../utils/phone-utils.js";
import { LENAQAR_CONTACT } from "../../config/lenaqar-contact.js";

const STORAGE_KEY = "lenaqar_network_activation_name";
const SNAPSHOT_STORAGE_KEY = "lenaqar_network_signup_snapshot";

function sanitizeActivationName(name) {
  return String(name || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 80);
}

function trimField(value) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

function pushLine(lines, label, value) {
  const text = trimField(value);
  if (!text) return;
  lines.push(`${label}: ${text}`);
}

/**
 * Prefill for Lena Network activation WhatsApp.
 * `withName` must include `{name}`; `withoutName` is used when the name is missing.
 */
export function composeNetworkActivationMessage(name, templates = {}) {
  const who = sanitizeActivationName(name);
  const withName = String(templates.withName || "");
  const withoutName = String(templates.withoutName || "");
  if (who && withName) return withName.replaceAll("{name}", who);
  return withoutName;
}

/**
 * Full Lena Network signup confirmation body for WhatsApp.
 * Includes every signup field except password (never sent over WhatsApp).
 *
 * @param {{
 *   form?: Record<string, unknown>,
 *   labels?: Record<string, string>,
 *   intro?: string,
 * }} args
 */
export function composeNetworkSignupWhatsAppMessage({
  form = {},
  labels = {},
  intro,
} = {}) {
  const lines = [String(intro || "").trim(), ""];
  pushLine(lines, labels.clientName || "Company", form.client_name);
  pushLine(lines, labels.fullName || "Full name", form.full_name);
  pushLine(lines, labels.email || "Email", form.email);
  pushLine(lines, labels.phone || "Mobile", form.phone_number);
  pushLine(lines, labels.logo || "Logo", form.logo_url);
  lines.push("", "من lenaqar.com");
  return lines.join("\n");
}

/**
 * True when the snapshot has every required signup field for a complete WhatsApp body.
 * Password is intentionally excluded — HTTP owns credentials; WhatsApp never does.
 */
export function hasCompleteNetworkSignupSnapshot(form = {}) {
  return Boolean(
    trimField(form.client_name) &&
      trimField(form.full_name) &&
      trimField(form.email) &&
      trimField(form.phone_number),
  );
}

/** Normalize a signup snapshot for storage / WhatsApp (never includes password). */
export function toNetworkSignupSnapshot(input = {}) {
  return {
    client_name: trimField(input.client_name),
    full_name: trimField(input.full_name),
    email: trimField(input.email).toLowerCase(),
    phone_number: trimField(input.phone_number),
    logo_url: trimField(input.logo_url),
  };
}

export function networkActivationHref(message) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.networkActivationWhatsappE164,
    message,
  );
}

export function saveNetworkActivationName(name) {
  if (typeof window === "undefined") return;
  const value = sanitizeActivationName(name);
  if (!value) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // private mode / quota
  }
}

export function readNetworkActivationName() {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeActivationName(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return "";
  }
}

export function saveNetworkSignupSnapshot(input) {
  if (typeof window === "undefined") return;
  const snapshot = toNetworkSignupSnapshot(input);
  if (!hasCompleteNetworkSignupSnapshot(snapshot)) return;
  try {
    sessionStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    saveNetworkActivationName(snapshot.full_name);
  } catch {
    // private mode / quota
  }
}

export function readNetworkSignupSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const snapshot = toNetworkSignupSnapshot(parsed);
    return hasCompleteNetworkSignupSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

/** Failures that should open the frontend-only WhatsApp fallback (not email_taken). */
export function shouldFallbackNetworkSignupToWhatsApp(code) {
  return (
    code === "save_failed" ||
    code === "validation_failed" ||
    code === "rate_limited"
  );
}
