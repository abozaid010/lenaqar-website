/**
 * Client-safe image URL config (NEXT_PUBLIC_* only).
 * Import from "use client" components and imageUtils — never import apiConfig.js there.
 */

const DEFAULT_IMAGE_API = "https://api.lenaai.net";

function normalizeBaseUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  return raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;
}

const imageBaseRaw =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  DEFAULT_IMAGE_API;

export const IMAGE_BASE_URL =
  normalizeBaseUrl(imageBaseRaw) ?? DEFAULT_IMAGE_API;

let imageHostname = "api.lenaai.net";
try {
  imageHostname = new URL(IMAGE_BASE_URL).hostname;
} catch {
  // keep default
}
export const IMAGE_HOSTNAME = imageHostname;
