import {
  isPossiblePhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js/min";
import type { CountryCode } from "libphonenumber-js/min";

/** Arabic-Indic digits (U+0660–U+0669) */
const ARABIC_INDIC_DIGITS = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
/** Persian / Eastern-Arabic digits (U+06F0–U+06F9) */
const EXTENDED_ARABIC_INDIC_DIGITS = "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9";

function buildDigitMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < 10; i += 1) {
    map[ARABIC_INDIC_DIGITS[i]] = String(i);
    map[EXTENDED_ARABIC_INDIC_DIGITS[i]] = String(i);
  }
  return map;
}

const UNICODE_DIGIT_TO_ASCII = buildDigitMap();

export type PhoneValidationCode =
  | "required"
  | "tooShort"
  | "tooLong"
  | "invalidLength"
  | "invalid";

/** English fallbacks — UI must translate via `phoneField.${code}` at render time. */
export const PHONE_VALIDATION_FALLBACKS: Record<PhoneValidationCode, string> = {
  required: "Phone number is required",
  tooShort: "Phone number is too short",
  tooLong: "Phone number is too long",
  invalidLength: "Phone number length is invalid",
  invalid: "Invalid phone number",
};

/** @deprecated Prefer {@link PHONE_VALIDATION_FALLBACKS} + i18n keys. */
export const PHONE_VALIDATION_MESSAGES = PHONE_VALIDATION_FALLBACKS;

export function phoneValidationKey(code: PhoneValidationCode): string {
  return `phoneField.${code}`;
}

export type PhonePayload = {
  e164: string;
  countryCode: string;
  nationalNumber: string;
  country: string | undefined;
};

/**
 * What {@link PhoneField} exposes via `onValueChange`: one combined international
 * number (E.164) for APIs and links. Split fields remain internal to this module.
 */
export type PhoneFieldPublicValue = {
  combined: string;
};

export function toPhoneFieldPublicValue(parsed: PhonePayload | null): PhoneFieldPublicValue | null {
  if (!parsed?.e164) return null;
  return { combined: parsed.e164 };
}

/**
 * Converts Arabic-Indic and Persian (Eastern Arabic) numerals to ASCII 0–9.
 * Other code units are left unchanged.
 */
export function normalizeDigits(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    out += UNICODE_DIGIT_TO_ASCII[ch] ?? ch;
  }
  return out;
}

/**
 * Keeps only ASCII digits and at most one leading `+`.
 * Applies {@link normalizeDigits} first. Safe for phone input pipelines.
 */
export function sanitizePhoneInput(input: string): string {
  const normalized = normalizeDigits(input);
  let result = "";
  let sawLeadingPlus = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const c = normalized[i];
    if (c === "+") {
      if (result.length === 0 && !sawLeadingPlus) {
        result += "+";
        sawLeadingPlus = true;
      }
      continue;
    }
    if (c >= "0" && c <= "9") {
      result += c;
    }
  }
  return result;
}

/**
 * Returns a submission-ready payload when the value is a possible phone number.
 * Uses {@link isPossiblePhoneNumber} with the given default country context.
 */
export function parsePhonePayload(
  value?: string,
  defaultCountry: CountryCode = "EG",
): PhonePayload | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!isPossiblePhoneNumber(trimmed, defaultCountry)) return null;
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed) return null;
  return {
    e164: parsed.number,
    countryCode: String(parsed.countryCallingCode),
    nationalNumber: String(parsed.nationalNumber),
    country: parsed.country,
  };
}

function digitsOnlyAscii(input: string): string {
  return normalizeDigits(input).replace(/\D/g, "");
}

/**
 * Best-effort E.164 for API, `tel:`, and WhatsApp. Uses `defaultCountry` when the
 * stored value is national digits (no country calling code).
 */
export function phoneToE164(
  raw?: string | null,
  defaultCountry: CountryCode = "EG",
): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  let parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (parsed?.isPossible()) return parsed.number;
  const digits = digitsOnlyAscii(trimmed);
  if (digits.length >= 8) {
    parsed = parsePhoneNumberFromString(digits, defaultCountry);
    if (parsed?.isPossible()) return parsed.number;
  }
  return null;
}

/**
 * International display with country code, e.g. `+20 10 97097909`.
 * Falls back to the raw string when parsing fails.
 */
export function formatPhoneForDisplay(
  raw?: string | null,
  defaultCountry: CountryCode = "EG",
): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const e164 = phoneToE164(trimmed, defaultCountry);
  if (!e164) return trimmed;
  const parsed = parsePhoneNumberFromString(e164);
  if (parsed?.isPossible()) return parsed.formatInternational();
  return trimmed;
}

/**
 * Masks the last `maskCount` digit characters for on-screen display.
 * Non-digits (spaces, `+`, dashes) are preserved. Full number stays available for copy/call.
 * @example maskPhoneForDisplay("+20 10 99900229") → "+20 10 9990****"
 */
export function maskPhoneForDisplay(
  displayPhone?: string | null,
  maskCount = 4,
): string {
  const value = String(displayPhone ?? "");
  if (!value || maskCount <= 0) return value;

  const chars = value.split("");
  let remaining = maskCount;
  for (let i = chars.length - 1; i >= 0 && remaining > 0; i -= 1) {
    if (/\d/.test(chars[i])) {
      chars[i] = "*";
      remaining -= 1;
    }
  }
  return chars.join("");
}

/**
 * Validation order: length hints from {@link validatePhoneNumberLength}, then
 * {@link isPossiblePhoneNumber}. Empty value yields an error only when `required` is true.
 * Returns a stable code — translate with {@link phoneValidationKey} in the UI.
 */
export function getPhoneValidationError(
  value: string | undefined,
  options?: { defaultCountry?: CountryCode; required?: boolean },
): PhoneValidationCode | undefined {
  const defaultCountry = options?.defaultCountry ?? "EG";
  const trimmed = value?.trim();
  if (!trimmed) {
    return options?.required ? "required" : undefined;
  }

  const lengthResult = validatePhoneNumberLength(trimmed, defaultCountry);
  if (lengthResult === "TOO_SHORT") return "tooShort";
  if (lengthResult === "TOO_LONG") return "tooLong";
  if (lengthResult === "INVALID_LENGTH") return "invalidLength";
  if (lengthResult === "NOT_A_NUMBER" || lengthResult === "INVALID_COUNTRY") {
    return "invalid";
  }

  if (!isPossiblePhoneNumber(trimmed, defaultCountry)) {
    return "invalid";
  }
  return undefined;
}

/**
 * @example Parent form submit handler
 * ```tsx
 * 'use client';
 *
 * import { useState } from 'react';
 * import { PhoneField } from '@/components/phone/PhoneField';
 * import type { PhoneFieldPublicValue } from '@/components/phone/phone-utils';
 *
 * export function ExampleLeadForm() {
 *   const [phone, setPhone] = useState("");
 *   const [phoneResult, setPhoneResult] = useState<PhoneFieldPublicValue | null>(null);
 *
 *   async function handleSubmit(e: React.FormEvent) {
 *     e.preventDefault();
 *     if (!phoneResult?.combined) return;
 *     await fetch('/api/leads', {
 *       method: 'POST',
 *       body: JSON.stringify({
 *         phone_number: phoneResult.combined,
 *       }),
 *     });
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <PhoneField
 *         name="phone"
 *         label="Phone"
 *         required
 *         value={phone}
 *         onChange={(v) => setPhone(v ?? "")}
 *         onValueChange={setPhoneResult}
 *       />
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
