/**
 * Normalize a phone for GET /messages/conversation?phone_number=…
 * Preserves international E.164 (+212…, +1…); falls back to EG parsing.
 *
 * Kept outside `api.js` so libphonenumber is not pulled into every route
 * that imports the CRM API module.
 */

import { phoneToE164 } from "@/components/phone/phone-utils";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

export function normalizeConversationPhone(phoneNumber, defaultCountry = "EG") {
  const trimmed = String(phoneNumber ?? "").trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(trimmed);
    if (parsed?.isPossible()) return parsed.number;
    return trimmed;
  }

  return phoneToE164(trimmed, defaultCountry) || trimmed;
}
