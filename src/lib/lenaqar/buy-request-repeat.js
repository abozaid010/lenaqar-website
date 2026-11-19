/**
 * Repeat-submit guard for the buy request: the identical submission (same sender,
 * name and requirement) sent again within the window reuses the first result instead
 * of posting a second time. A changed requirement is always posted. Only a SHA-256
 * key is stored — never the phone, name or requirement itself.
 */

export const REPEAT_WINDOW_MS = 5 * 60 * 1000;

const STORAGE_KEY = "lenaqar_buy_request_last_submit";

/** JSON with object keys sorted, so equal requests give equal text whatever their key order. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * SHA-256 hex identifying one submission: who sent it (the saved request's user id,
 * else the phone's digits), the name typed, and the whole requirement. The same
 * submission twice gives the same key; any changed field gives another one, so an
 * edited request is never mistaken for a repeat. "" when there is no identity or
 * no Web Crypto.
 */
export async function buyRequestSubmitKey({ userId, phone, name, requirement }) {
  const digits = String(phone || "").replace(/\D/g, "");
  const who = userId ? `u:${userId}` : digits ? `p:${digits}` : "";
  if (!who) return "";
  try {
    const text = [who, String(name || "").trim(), canonicalJson(requirement)].join("|");
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    return "";
  }
}

/**
 * Whether this submit is a conversion for ads: only when it created the request.
 * An edit of a saved request, or a reused identical submit, is not a new lead.
 */
export function isNewBuyRequestConversion({ isEdit, repeated }) {
  return !isEdit && !repeated;
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
