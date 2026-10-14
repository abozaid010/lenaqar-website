import { SITE } from "@/config/site";

const SITE_URL = SITE.url;

/** Sitewide default — buyer-first. Pages override with absolute titles where needed. */
const LENAQAR_DESCRIPTION =
  "بتدور على شقة أو فيلا أو شاليه في مصر؟ اكتب طلبك وحدد ميزانيتك والمكان والمواصفات. لينا عقار تساعدك تلاقي عقارات مناسبة لاحتياجاتك — ابدأ بطلب واضح.";

const LENAQAR_TITLE = "لينا عقار | دور على بيتك المناسب في مصر حسب طلبك وميزانيتك";

export const defaultMetadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: LENAQAR_TITLE,
    template: "%s | لينا عقار",
  },
  icons: {
    icon: "/images/logo-5.png",
    shortcut: "/images/logo-5.png",
    apple: "/images/logo-5.png",
  },
  description: LENAQAR_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: LENAQAR_TITLE,
    description: LENAQAR_DESCRIPTION,
    siteName: "لينا عقار",
    locale: "ar_EG",
    images: [
      {
        url: `${SITE_URL}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: "لينا عقار",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: LENAQAR_TITLE,
    description: LENAQAR_DESCRIPTION,
    images: [`${SITE_URL}/images/logo.png`],
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
};

export const SITE_NAME = SITE.name;
export { SITE_URL };
