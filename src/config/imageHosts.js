export const IMAGEKIT_HOSTNAME = "ik.imagekit.io";
export const DEFAULT_IMAGE_API_HOSTNAME = "api.lenaai.net";

function parseHostname(urlRaw, fallback) {
  if (!urlRaw || typeof urlRaw !== "string") return fallback;
  const normalized = urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`;
  try {
    return new URL(normalized).hostname;
  } catch {
    return fallback;
  }
}

/**
 * Hostnames allowed for next/image. Always includes production API + ImageKit so
 * images from api.lenaai.net work even when NEXT_PUBLIC_API_BASE_URL points at localhost.
 */
export function getAllowedImageHostnames() {
  const apiRaw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    `https://${DEFAULT_IMAGE_API_HOSTNAME}`;
  const imageRaw = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || apiRaw;

  return [
    ...new Set([
      IMAGEKIT_HOSTNAME,
      DEFAULT_IMAGE_API_HOSTNAME,
      parseHostname(apiRaw, DEFAULT_IMAGE_API_HOSTNAME),
      parseHostname(imageRaw, DEFAULT_IMAGE_API_HOSTNAME),
    ]),
  ].filter(Boolean);
}

/** remotePatterns for next.config.mjs images.remotePatterns */
export function buildImageRemotePatterns() {
  const patterns = [
    {
      protocol: "https",
      hostname: IMAGEKIT_HOSTNAME,
      pathname: "/lenaai/**",
    },
  ];

  for (const hostname of getAllowedImageHostnames()) {
    if (hostname === IMAGEKIT_HOSTNAME) continue;
    patterns.push(
      { protocol: "https", hostname, pathname: "/**" },
      { protocol: "http", hostname, pathname: "/**" }
    );
  }

  return patterns;
}
