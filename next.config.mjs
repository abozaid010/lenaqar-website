/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
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
    domains: [process.env.NEXT_PUBLIC_API_DOMAIN, 'api.lenaai.net'],
  },
  // TODO: i18n configuration in next.config.mjs is unsupported in App Router.
  // i18n: {
  //   locales: ["en", "ar"],  // Supported locales
  //   defaultLocale: "ar", // Default locale
  //   // localeDetection: true, // Enable automatic locale detection
  // },
};

export default nextConfig;