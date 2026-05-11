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

export const PHONE_VALIDATION_MESSAGES = {
  required: "Phone number is required",
  tooShort: "Phone number is too short",
  tooLong: "Phone number is too long",
  invalidLength: "Phone number length is invalid",
  invalid: "Invalid phone number",
} as const;

export type PhonePayload = {
  e164: string;
  countryCode: string;
  nationalNumber: string;
  country: string | undefined;
};

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

/**
 * Validation order: length hints from {@link validatePhoneNumberLength}, then
 * {@link isPossiblePhoneNumber}. Empty value yields an error only when `required` is true.
 */
export function getPhoneValidationError(
  value: string | undefined,
  options?: { defaultCountry?: CountryCode; required?: boolean },
): string | undefined {
  const defaultCountry = options?.defaultCountry ?? "EG";
  const trimmed = value?.trim();
  if (!trimmed) {
    return options?.required ? PHONE_VALIDATION_MESSAGES.required : undefined;
  }

  const lengthResult = validatePhoneNumberLength(trimmed, defaultCountry);
  if (lengthResult === "TOO_SHORT") return PHONE_VALIDATION_MESSAGES.tooShort;
  if (lengthResult === "TOO_LONG") return PHONE_VALIDATION_MESSAGES.tooLong;
  if (lengthResult === "INVALID_LENGTH") return PHONE_VALIDATION_MESSAGES.invalidLength;
  if (lengthResult === "NOT_A_NUMBER" || lengthResult === "INVALID_COUNTRY") {
    return PHONE_VALIDATION_MESSAGES.invalid;
  }

  if (!isPossiblePhoneNumber(trimmed, defaultCountry)) {
    return PHONE_VALIDATION_MESSAGES.invalid;
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
 * import type { PhonePayload } from '@/components/phone/phone-utils';
 *
 * export function ExampleLeadForm() {
 *   const [phone, setPhone] = useState("");
 *   const [payload, setPayload] = useState<PhonePayload | null>(null);
 *
 *   async function handleSubmit(e: React.FormEvent) {
 *     e.preventDefault();
 *     if (!payload) return;
 *     await fetch('/api/leads', {
 *       method: 'POST',
 *       body: JSON.stringify({
 *         phone_country_code: payload.countryCode,
 *         phone_number: payload.nationalNumber,
 *         phone_e164: payload.e164,
 *         phone_country: payload.country,
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
 *         onValueChange={setPayload}
 *       />
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
