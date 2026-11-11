/**
 * Repeat-submit guard for the buy request: the same phone submitted again
 * within the window reuses the first result instead of posting a second time.
 * Only a SHA-256 key of the phone is stored — never the phone itself.
 */

export const REPEAT_WINDOW_MS = 5 * 60 * 1000;

const STORAGE_KEY = "lenaqar_buy_request_last_submit";

/** SHA-256 hex of the phone's digits; "" when there is no phone or no Web Crypto. */
export async function buyRequestRepeatKey(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  try {
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(digits),
    );
    return Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    return "";
  }
}

/** Pure: the stored submit when it has the same key and is inside the window, else null. */
export function findRepeatSubmit(record, key, now = Date.now()) {
  if (!key || !record || record.key !== key) return null;
  const age = now - Number(record.at);
  if (!(age >= 0 && age < REPEAT_WINDOW_MS)) return null;
  return record;
}

export function readLastBuyRequestSubmit() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveLastBuyRequestSubmit(
  { key, userId, matchRef = "" },
  now = Date.now(),
) {
  if (!key || typeof window === "undefined") return;
  try {
    // matchRef rides along so a repeat submit still opens WhatsApp with the
    // request's reference (it is a random code, not personal data).
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ key, userId, matchRef, at: now }),
    );
  } catch {
    // private mode / quota
  }
}
