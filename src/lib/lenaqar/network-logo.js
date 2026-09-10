export const NETWORK_LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const NETWORK_LOGO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
export const NETWORK_LOGO_ACCEPT = "image/jpeg,image/png,image/webp";

export function isNetworkLogoFile(file) {
  return Boolean(file && NETWORK_LOGO_MIME_TYPES.has(file.type));
}
