import { phoneToE164 } from "@/components/phone/phone-utils";

export const ANDROID_CALL_TIP_STORAGE_KEY = "lena_android_call_tip_seen_v1";

/**
 * Builds a `tel:` href with best-effort E.164. Falls back to sanitized digits
 * when parsing fails so the link still works.
 */
export function getTelHref(rawPhone, defaultCountry = "EG") {
  const trimmed = String(rawPhone ?? "").trim();
  if (!trimmed) return null;

  const e164 = phoneToE164(trimmed, defaultCountry);
  if (e164) return `tel:${e164}`;

  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits || digits === "+") return null;
  return `tel:${digits}`;
}

/** Best-effort E.164 (or trimmed raw) for copy / display alongside tel links. */
export function getCallPhoneValue(rawPhone, defaultCountry = "EG") {
  const trimmed = String(rawPhone ?? "").trim();
  if (!trimmed) return null;
  return phoneToE164(trimmed, defaultCountry) || trimmed;
}

export function isAndroidUserAgent(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  return /Android/i.test(ua || "");
}

export function hasSeenAndroidCallTip() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ANDROID_CALL_TIP_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markAndroidCallTipSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANDROID_CALL_TIP_STORAGE_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

export function shouldShowAndroidCallTip() {
  return isAndroidUserAgent() && !hasSeenAndroidCallTip();
}
