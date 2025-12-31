"use client";

import Image from "next/image";
import { isConfiguredHostname } from "@/utils/imageUtils";

/**
 * A wrapper around next/image that safely handles unconfigured hostnames.
 * If the hostname is not configured in next.config.js, it returns null (skips the image)
 * instead of crashing the application.
 */
export default function SafeImage({ src, alt, ...props }) {
  // Check if the hostname is configured in next.config.mjs logic
  // We use the utility function that replicates the whitelist logic
  const isConfigured = isConfiguredHostname(src);

  if (!isConfigured) {
    if (process.env.NODE_ENV === "development" && src) {
      console.warn(
        `SafeImage: Skipping image with unconfigured hostname: ${src}`
      );
    }
    return null;
  }

  return <Image src={src} alt={alt || ""} {...props} />;
}

