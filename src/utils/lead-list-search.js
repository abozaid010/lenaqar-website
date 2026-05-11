import { normalizeDigits, phoneToE164 } from "@/components/phone/phone-utils";

/** Digits only after Arabic/Persian → ASCII normalization (for phone substring match). */
export function digitsOnlyNormalized(input) {
  return normalizeDigits(String(input ?? "")).replace(/\D/g, "");
}

/** True when the trimmed query looks like a phone fragment (digits + common phone punctuation). */
export function isMostlyPhoneQuery(trimmed) {
  if (!trimmed) return false;
  return /^[\d\s\-+().]+$/.test(trimmed) && /\d/.test(trimmed);
}

/**
 * Compact digit-like queries for the API (strip spaces). Name/text queries unchanged.
 */
export function normalizeSearchQueryForApi(trimmed) {
  if (!trimmed) return trimmed;
  if (isMostlyPhoneQuery(trimmed)) {
    return trimmed.replace(/\s/g, "");
  }
  return trimmed;
}

/**
 * Client filter: name contains query (case-insensitive), or phone contains query.
 * For digit-heavy input, compares after removing spaces and non-digits so "55727254"
 * matches "+20 557 272 654" style values.
 */
export function leadMatchesSearchQuery(user, rawQuery) {
  const q = String(rawQuery ?? "").trim();
  if (!q) return true;

  const name = (user?.name || user?.user_name || "").toLowerCase();
  if (name.includes(q.toLowerCase())) return true;

  const phone = String(user?.phone_number ?? "");
  const phoneCanonical = phoneToE164(phone, "EG") || phone;
  const qDigits = digitsOnlyNormalized(q);
  const pDigits = digitsOnlyNormalized(phoneCanonical);
  if (qDigits.length > 0 && pDigits.includes(qDigits)) return true;

  const qCompact = q.replace(/\s/g, "").toLowerCase();
  const pCompact = phoneCanonical.replace(/\s/g, "").toLowerCase();
  if (qCompact.length > 0 && pCompact.includes(qCompact)) return true;

  return false;
}
