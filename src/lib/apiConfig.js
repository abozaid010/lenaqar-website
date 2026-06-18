/**
 * Single source of truth for server-side API base URL.
 *
 * IMPORTANT: Never use NEXT_PUBLIC_API_BASE_URL for the API origin.
 * NEXT_PUBLIC_* vars are inlined into the client bundle at build time, which
 * would expose the backend hostname in the browser. All client calls go through
 * the same-origin BFF (/api/crm/*) — only server-side code needs API_BASE_URL.
 * Set API_BASE_URL (no NEXT_PUBLIC_ prefix) in your server environment.
 */
const api_base_url = process.env.API_BASE_URL || "https://api.lenaai.net";
export const API_BASE_URL =
  api_base_url.startsWith("http://") || api_base_url.startsWith("https://")
    ? api_base_url
    : `https://${api_base_url}`;

/**
 * X-API-Key for unauthenticated backend endpoints (/public/*, /campaign/*, /whatsapp/*).
 * Server-only: set X_API_KEY (no NEXT_PUBLIC_ prefix) in your server environment.
 * The BFF catch-all (/api/crm/[...path]) adds this header server-side — the key
 * never reaches the browser or client bundle.
 */
export const PUBLIC_X_API_KEY = (process.env.X_API_KEY ?? "").trim();
export const HAS_X_API_KEY = PUBLIC_X_API_KEY.length > 0;

if (!HAS_X_API_KEY && process.env.NODE_ENV !== "test") {
  console.error(
    "[apiConfig] X_API_KEY is not set. /public/* and /campaign/* endpoints will return 401/403. " +
    "Set X_API_KEY (server-only, no NEXT_PUBLIC_ prefix) in your server environment."
  );
}

let apiHostname = "api.lenaai.net";
try {
  apiHostname = new URL(API_BASE_URL).hostname;
} catch {
  // fallback if malformed env
}
export const API_HOSTNAME = apiHostname;

// Image base URL: optional; defaults to API so images work when API is same origin.
// In dev, set NEXT_PUBLIC_IMAGE_BASE_URL=https://api.lenaai.net so images load from prod while API is localhost.
const imageBaseRaw =
  process.env.IMAGE_BASE_URL || process.env.NEXT_PUBLIC_IMAGE_BASE_URL || api_base_url;
export const IMAGE_BASE_URL =
  imageBaseRaw.startsWith("http://") || imageBaseRaw.startsWith("https://")
    ? imageBaseRaw
    : `https://${imageBaseRaw}`;

let imageHostname = apiHostname;
try {
  imageHostname = new URL(IMAGE_BASE_URL).hostname;
} catch {
  // keep apiHostname
}
export const IMAGE_HOSTNAME = imageHostname;
