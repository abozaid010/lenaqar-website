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
 * Map a free-text leads search into GET /messages/quick-search args.
 * Phone-like input → `{ phone }` (E.164 when possible); otherwise `{ name }`.
 * @param {unknown} rawQuery
 * @returns {{ phone: string } | { name: string } | null}
 */
export function buildQuickSearchArgs(rawQuery) {
  const trimmed = String(rawQuery ?? "").trim();
  if (!trimmed) return null;

  const normalized = normalizeSearchQueryForApi(trimmed);
  if (isMostlyPhoneQuery(trimmed)) {
    return { phone: phoneToE164(normalized, "EG") || normalized };
  }
  return { name: normalized };
}

/**
 * Detect quick-search params from a dashboard filter key / fetch payload.
 * Prefers explicit `phone`/`name`; falls back to legacy `{ query }`.
 * @param {Record<string, unknown> | null | undefined} params
 * @returns {{ phone?: string, name?: string } | null}
 */
export function resolveQuickSearchFromParams(params) {
  if (!params || typeof params !== "object") return null;

  const phone = typeof params.phone === "string" ? params.phone.trim() : "";
  const name = typeof params.name === "string" ? params.name.trim() : "";
  if (phone || name) {
    return {
      ...(phone ? { phone } : {}),
      ...(name ? { name } : {}),
    };
  }

  if (typeof params.query === "string" && params.query.trim()) {
    return buildQuickSearchArgs(params.query);
  }

  return null;
}

/**
 * Client filter: name or company contains query (case-insensitive), or phone
 * contains query. For digit-heavy input, compares after removing spaces and
 * non-digits so "55727254" matches "+20 557 272 654" style values.
 *
 * Company matching mirrors the backend `query` behaviour so company-only matches
 * returned by the API are not hidden by the client-side re-filter.
 */
export function leadMatchesSearchQuery(user, rawQuery) {
  const q = String(rawQuery ?? "").trim();
  if (!q) return true;

  const qLower = q.toLowerCase();

  const name = (user?.name || user?.user_name || "").toLowerCase();
  if (name.includes(qLower)) return true;

  const company = String(user?.company_name ?? "").toLowerCase();
  if (company && company.includes(qLower)) return true;

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
