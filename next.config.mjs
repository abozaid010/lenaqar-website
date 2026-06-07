import nextEnv from "@next/env";
import { buildImageRemotePatterns } from "./src/config/imageHosts.js";

// Ensure .env* are on process.env before any reads (recommended for next.config)
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

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
    remotePatterns: buildImageRemotePatterns(),
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
  // Cache-Control for contact page (CEO digital business card) – CDN & browser
  async headers() {
    return [
      {
        source: "/contact",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800",
          },
        ],
      },
      {
        source: "/contact/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const adminPaths = [
      'dashboard', 'campaigns', 'campaign-chat', 'schedule',
      'analytics', 'units', 'team', 'myProjects', 'developers', 'news', 'map',
    ];
    return adminPaths.flatMap((path) => [
      { source: `/:clientId/${path}`, destination: `/${path}` },
      { source: `/:clientId/${path}/:rest*`, destination: `/${path}/:rest*` },
    ]);
  },
};

export default nextConfig;