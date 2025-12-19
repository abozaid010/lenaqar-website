import { getSizeLimitForServer } from './src/config/imageUpload.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: getSizeLimitForServer(),
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
        hostname: "api.lenaai.net",
        pathname: "/**",
      },
      ...(process.env.NEXT_PUBLIC_API_DOMAIN
        ? [{
            protocol: "https",
            hostname: process.env.NEXT_PUBLIC_API_DOMAIN,
            pathname: "/**",
          }]
        : []),
    ],
    // Note: 'domains' is deprecated in Next.js 13+, using remotePatterns instead
    // domains: [process.env.NEXT_PUBLIC_API_DOMAIN, 'api.lenaai.net'],
    // Add better error handling for images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    // Improve image loading performance
    minimumCacheTTL: 60,
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