import { SITE } from "@/config/site";

/** Shared Open Graph / canonical metadata for buyer landing pages. */
export function buyerLandingMetadata(landing) {
  const url = `${SITE.url}${landing.href}`;
  return {
    title: landing.title,
    description: landing.description,
    openGraph: {
      title: landing.title,
      description: landing.description,
      url,
      locale: "ar_EG",
      siteName: SITE.name,
      type: "website",
      images: [
        {
          url: `${SITE.url}/images/logo.png`,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    alternates: { canonical: url },
  };
}
