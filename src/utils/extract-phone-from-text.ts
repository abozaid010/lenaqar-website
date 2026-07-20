import {
  normalizeDigits,
  phoneToE164,
  sanitizePhoneInput,
} from "@/components/phone/phone-utils";

/**
 * Extract the first valid phone number from free-form post text.
 *
 * Supports Egyptian local/international formats, spaced/dashed numbers,
 * and WhatsApp links (wa.me / api.whatsapp.com). Returns a single E.164
 * number (e.g. "+201027450274") or null when none is valid.
 */
export function extractPhoneFromText(text: string | null | undefined): string | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;

  const normalizedText = normalizeDigits(raw);
  const candidates = [
    ...collectWhatsAppLinkCandidates(normalizedText),
    ...collectPlainPhoneCandidates(normalizedText),
  ];

  for (const candidate of candidates) {
    const e164 = normalizePhoneCandidate(candidate);
    if (e164) return e164;
  }

  return null;
}

function collectWhatsAppLinkCandidates(text: string): string[] {
  const out: string[] = [];

  for (const match of text.matchAll(
    /(?:https?:\/\/)?(?:www\.)?wa\.me\/(\+?\d{8,15})/gi,
  )) {
    if (match[1]) out.push(match[1]);
  }

  for (const match of text.matchAll(
    /(?:https?:\/\/)?(?:www\.)?api\.whatsapp\.com\/send\?[^\s]*?\bphone=(\+?\d{8,15})/gi,
  )) {
    if (match[1]) out.push(match[1]);
  }

  return out;
}

function collectPlainPhoneCandidates(text: string): string[] {
  const out: string[] = [];

  // +20 / 0020 / 20 + Egyptian mobile (1[0125]……)
  for (const match of text.matchAll(
    /(?<![\d])(?:\+|00)?20[\s\-.]?1[0125](?:[\s\-.]?\d){8}(?!\d)/g,
  )) {
    out.push(match[0]);
  }

  // Local Egyptian mobile: 01[0125]xxxxxxxx (spaces/dashes allowed)
  for (const match of text.matchAll(
    /(?<![\d])0?1[0125](?:[\s\-.]?\d){8}(?!\d)/g,
  )) {
    out.push(match[0]);
  }

  // Other international numbers starting with + or 00
  for (const match of text.matchAll(
    /(?<![\d])(?:\+|00)\d{1,3}[\s\-.]?\d(?:[\s\-.]?\d){6,13}(?!\d)/g,
  )) {
    out.push(match[0]);
  }

  return out;
}

/** Deterministic Egyptian mobile normalization (no libphonenumber required). */
function normalizeEgyptianMobileDigits(digits: string): string | null {
  let d = String(digits || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);

  // 20 + 1[0125] + 8 digits
  if (/^20(1[0125]\d{8})$/.test(d)) return `+${d}`;
  // 0 + 1[0125] + 8 digits
  if (/^0(1[0125]\d{8})$/.test(d)) return `+20${d.slice(1)}`;
  // 1[0125] + 8 digits (national without leading 0)
  if (/^(1[0125]\d{8})$/.test(d)) return `+20${d}`;

  return null;
}

function normalizePhoneCandidate(candidate: string): string | null {
  const withAsciiDigits = normalizeDigits(String(candidate ?? "").trim());
  if (!withAsciiDigits) return null;

  const digits = withAsciiDigits.replace(/\D/g, "");
  const egyptian = normalizeEgyptianMobileDigits(digits);
  if (egyptian) return egyptian;

  try {
    const sanitized = sanitizePhoneInput(withAsciiDigits);
    return (
      phoneToE164(sanitized, "EG") ||
      phoneToE164(withAsciiDigits.replace(/[\s\-().]/g, ""), "EG") ||
      null
    );
  } catch {
    return null;
  }
}
