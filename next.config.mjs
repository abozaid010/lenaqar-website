import nextEnv from "@next/env";
import { buildImageRemotePatterns } from "./src/config/imageHosts.js";

// Ensure .env* are on process.env before any reads (recommended for next.config)
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Cap workers on small GCP VMs only. Vercel build machines should use all CPUs.
    ...(process.env.VERCEL ? {} : { cpus: 1 }),
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
  async headers() {
    const securityHeaders = [
      // Prevent the site from being framed by another origin (clickjacking).
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      // Stop browsers from MIME-sniffing the Content-Type.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Legacy XSS filter — kept for older browser compat.
      { key: "X-XSS-Protection", value: "1; mode=block" },
      // Limit referrer info sent to third parties.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Disable browser features not used by this app.
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // Force HTTPS for 2 years once visited (set by server, respected by browser).
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      // Apply security headers to every route.
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // API routes: no caching, no CORS from unknown origins.
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
  async rewrites() {
    const adminPaths = [
      'dashboard', 'campaigns', 'campaign-chat', 'schedule',
      'analytics', 'units', 'team', 'myProjects', 'developers', 'news', 'map', 'notifications',
      'social-media',
      'market-index',
      'locations',
      'tools',
      'matching',
    ];
    // `api` is excluded so `/api/social-media/*` BFF routes are not rewritten to pages.
    const clientIdSegment = "/:clientId((?!api$)[^/]+)";
    const adminRewrites = adminPaths.flatMap((path) => [
      { source: `${clientIdSegment}/${path}`, destination: `/${path}` },
      { source: `${clientIdSegment}/${path}/:rest*`, destination: `/${path}/:rest*` },
    ]);

    return adminRewrites;
  },
};

export default nextConfig;