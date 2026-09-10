import { formatPhoneForWhatsApp } from "../../utils/phone-utils.js";
import { LENAQAR_CONTACT } from "../../config/lenaqar-contact.js";

const STORAGE_KEY = "lenaqar_network_activation_name";

function sanitizeActivationName(name) {
  return String(name || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 80);
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
