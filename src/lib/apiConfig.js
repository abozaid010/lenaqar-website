/**
 * Single source of truth for API base URL from NEXT_PUBLIC_API_BASE_URL.
 * Normalizes to full URL (adds https:// if missing) and exports hostname for image/config use.
 */

const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";
export const API_BASE_URL =
  raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

let apiHostname = "api.lenaai.net";
try {
  apiHostname = new URL(API_BASE_URL).hostname;
} catch {
  // fallback if malformed env
}
export const API_HOSTNAME = apiHostname;

// Image base URL: optional; defaults to API so images work when API is same origin.
// In dev, set NEXT_PUBLIC_IMAGE_BASE_URL=https://api.lenaai.net so images load from prod while API is localhost.
const imageBaseRaw = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || raw;
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
