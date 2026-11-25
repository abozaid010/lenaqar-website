import { BRAND } from "@/config/brand";
import { SITE } from "@/config/site";

const SITE_URL = SITE.url;

/** Sitewide default — buyer-first. Pages override with absolute titles where needed. */
const LENAQAR_DESCRIPTION =
  "بتدور على شقة أو فيلا أو شاليه في مصر؟ اكتب طلبك وحدد ميزانيتك والمكان والمواصفات. لينا عقار بتساعدك تلاقي عقارات مناسبة لاحتياجاتك — ابدأ بطلب واضح.";

const LENAQAR_TITLE = "Lenaqar | لينا عقار — دور على بيتك المناسب في مصر";

export const defaultMetadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND.name,
  title: {
    default: LENAQAR_TITLE,
    template: "%s | لينا عقار",
  },
  icons: {
    icon: [
      { url: "/brand/lenaqar-v1/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/brand/lenaqar-v1/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: BRAND.icon, sizes: "any", type: "image/svg+xml" },
    ],
    shortcut: "/brand/lenaqar-v1/favicon.ico",
    apple: [{ url: "/brand/lenaqar-v1/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  description: LENAQAR_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: LENAQAR_TITLE,
    description: LENAQAR_DESCRIPTION,
    siteName: BRAND.name,
    locale: "ar_EG",
    images: [
      {
        url: `${SITE_URL}${BRAND.socialImage}`,
        width: 1200,
        height: 630,
        alt: BRAND.socialAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: LENAQAR_TITLE,
    description: LENAQAR_DESCRIPTION,
    images: [{ url: `${SITE_URL}${BRAND.socialImage}`, alt: BRAND.socialAlt }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ar-EG": SITE_URL,
    },
  },
  // Google Search Console ownership of https://www.lenaqar.com/ (URL-prefix
  // property, added 2026-11-15). Public token; removing it un-verifies the site.
  verification: {
    google: "aJzg6-xwPxcgXr3Aq10UZoSR1KlPeIzOwWw_C4i1EMw",
  },
};

export const SITE_NAME = SITE.name;
export { SITE_URL };
