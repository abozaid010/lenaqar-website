// Image hostname from NEXT_PUBLIC_IMAGE_BASE_URL (fallback API) for next/image remotePatterns
const imageBaseUrlRaw =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.lenaai.net";
const imageBaseUrl = imageBaseUrlRaw.startsWith("http")
  ? imageBaseUrlRaw
  : `https://${imageBaseUrlRaw}`;
const imageHostname = (() => {
  try {
    return new URL(imageBaseUrl).hostname;
  } catch {
    return "api.lenaai.net";
  }
})();


/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Body size limit for server actions (matches max image upload size in src/config/imageUpload.js)
      bodySizeLimit: '10mb',
    },
  },
  // Add better error handling and performance optimizations
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Add compression and better caching
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/lenaai/**",
      },
      {
        protocol: "https",
        hostname: imageHostname,
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: imageHostname,
        pathname: "/**",
      },
    ],
    // Add better error handling for images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    // Improve image loading performance
    minimumCacheTTL: 60*60*8, // 8 hours
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // TODO: i18n configuration in next.config.mjs is unsupported in App Router.
  // i18n: {
  //   locales: ["en", "ar"],  // Supported locales
  //   defaultLocale: "ar", // Default locale
  //   // localeDetection: true, // Enable automatic locale detection
  // },
};

export default nextConfig;