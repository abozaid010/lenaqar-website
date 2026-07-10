// Use /max metadata so isValid matches backend (Python phonenumbers).
// /min incorrectly treats some incomplete EG numbers (e.g. 20100861138) as valid.
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { phoneToE164 } from "@/components/phone/phone-utils";

const WHATSAPP_CHAT_ID_PATTERN = /@(lid|c\.us|s\.whatsapp\.net|g\.us)$/i;

/**
 * True when the value looks like a WhatsApp chat id (e.g. 26405727404146@lid).
 */
export function isWhatsappChatId(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  return trimmed.includes("@") || WHATSAPP_CHAT_ID_PATTERN.test(trimmed);
}

/**
 * Normalize a valid phone for POST /whatsapp/send_messages (digits only, no "+").
 * Returns null when the number is missing or invalid for the WhatsApp API.
 */
export function toWhatsappApiPhoneDigits(raw, defaultCountry = "EG") {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || isWhatsappChatId(trimmed)) return null;

  const e164 = phoneToE164(trimmed, defaultCountry);
  if (!e164) return null;

  // Backend rejects numbers that fail phonenumbers.is_valid_number — require the same.
  if (!isValidPhoneNumber(e164)) return null;

  return e164.replace(/^\+/, "");
}

/**
 * Resolve recipient fields for POST /whatsapp/send_messages.
 * Prefers phone_number when present; uses chat_id only for WhatsApp chat ids.
 *
 * @returns {{ phone_number: string } | { chat_id: string } | null}
 */
export function resolveWhatsappRecipientFields(
  { phone_number, chat_id } = {},
  defaultCountry = "EG",
) {
  const rawPhone = String(phone_number ?? "").trim();
  if (rawPhone) {
    if (isWhatsappChatId(rawPhone)) {
      return { chat_id: rawPhone };
    }

    const apiPhone = toWhatsappApiPhoneDigits(rawPhone, defaultCountry);
    if (apiPhone) {
      return { phone_number: apiPhone };
    }

    return null;
  }

  const explicitChatId = String(chat_id ?? "").trim();
  if (explicitChatId) {
    return { chat_id: explicitChatId };
  }

  return null;
}

/** Stable key for deduplicating WhatsApp recipients in bulk sends. */
export function getWhatsappRecipientDedupeKey(recipient) {
  if (!recipient) return "";
  return (
    String(recipient.phone_number ?? "").trim() ||
    String(recipient.chat_id ?? "").trim()
  );
}

/**
 * Build a lead/dashboard row into a WhatsApp recipient ({ chat_id } or { phone_number }).
 */
export function leadToWhatsappRecipient(lead) {
  if (!lead) return null;

  const resolved = resolveWhatsappRecipientFields({
    chat_id: lead.chat_id,
    phone_number: lead.phone_number,
  });
  if (!resolved) return null;

  const user_name = String(lead.name || "").trim();
  const fallback =
    resolved.chat_id || resolved.phone_number || "";

  return {
    ...resolved,
    user_name: user_name || fallback,
  };
}
