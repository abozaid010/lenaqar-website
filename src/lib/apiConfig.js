/**
 * Server-only API config. Do not import from client components — use imageConfig.js
 * for IMAGE_BASE_URL / image hostnames in the browser.
 *
 * Prefer `API_BASE_URL` and `X_API_KEY` (no NEXT_PUBLIC_ prefix) in production.
 * Falls back to legacy NEXT_PUBLIC_* names still present on some deployments.
 */
const api_base_url =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.lenaai.net";
export const API_BASE_URL =
  api_base_url.startsWith("http://") || api_base_url.startsWith("https://")
    ? api_base_url
    : `https://${api_base_url}`;

/**
 * X-API-Key for unauthenticated backend endpoints (/public/*, /campaign/*, /whatsapp/*).
 * Read server-side only — never import apiConfig from client components.
 */
export const PUBLIC_X_API_KEY = (
  process.env.X_API_KEY ??
  process.env.NEXT_PUBLIC_X_API_KEY ??
  ""
).trim();
export const HAS_X_API_KEY = PUBLIC_X_API_KEY.length > 0;

if (!HAS_X_API_KEY && process.env.NODE_ENV !== "test") {
  console.error(
    "[apiConfig] Neither X_API_KEY nor NEXT_PUBLIC_X_API_KEY is set. " +
      "/public/* endpoints will return 401 and the opportunities feed will be empty. " +
      "Set X_API_KEY (preferred, server-only) in your deployment environment."
  );
}

let apiHostname = "api.lenaai.net";
try {
  apiHostname = new URL(API_BASE_URL).hostname;
} catch {
  // fallback if malformed env
}
export const API_HOSTNAME = apiHostname;
