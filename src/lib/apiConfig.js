/**
 * Server-only API config. Do not import from client components — use imageConfig.js
 * for IMAGE_BASE_URL / image hostnames in the browser.
 *
 * Set API_BASE_URL and X_API_KEY (no NEXT_PUBLIC_ prefix) in your server environment.
 * Client CRM calls go through the same-origin BFF (/api/crm/*).
 */
const api_base_url = process.env.API_BASE_URL || "https://api.lenaai.net";
export const API_BASE_URL =
  api_base_url.startsWith("http://") || api_base_url.startsWith("https://")
    ? api_base_url
    : `https://${api_base_url}`;

/**
 * X-API-Key for unauthenticated backend endpoints (/public/*, /campaign/*, /whatsapp/*).
 * Added server-side by the BFF catch-all — the key never reaches the browser.
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
