/**
 * Ad attribution for the buy request: the landing URL's UTM values and
 * `lead_code`, kept for the visit and sent with the form submit.
 */

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "lead_code",
];

/** Same cap the backend applies to each value. */
export const ATTRIBUTION_VALUE_MAX = 500;

const STORAGE_KEY = "lenaqar_attribution";

/** Whitelist: only the known keys, non-empty strings, trimmed and capped. */
export function sanitizeAttribution(input) {
  const out = {};
  if (!input || typeof input !== "object") return out;
  for (const key of ATTRIBUTION_KEYS) {
    const raw = input[key];
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, ATTRIBUTION_VALUE_MAX);
    if (value) out[key] = value;
  }
  return out;
}

/** Pure parser: a URL query string → attribution object ({} when none). */
export function parseAttribution(search) {
  const params = new URLSearchParams(typeof search === "string" ? search : "");
  const found = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value != null) found[key] = value;
  }
  return sanitizeAttribution(found);
}

/** Store the landing URL's attribution once per visit — first touch wins. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const attribution = parseAttribution(window.location.search);
    if (Object.keys(attribution).length === 0) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // private mode / quota
  }
}

export function readAttribution() {
  if (typeof window === "undefined") return {};
  try {
    return sanitizeAttribution(JSON.parse(sessionStorage.getItem(STORAGE_KEY)));
  } catch {
    return {};
  }
}
