import { SITE } from "@/config/site";

const SITE_URL = SITE.url;

const LENAQAR_DESCRIPTION =
  "لينا عقار بتخرجك من أقساط الوحدة أسرع وبفلوس أكتر، باتفاق مكتوب. أسعار من المطور بتاريخها، ومن غير مضايقات.";

export const defaultMetadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "لينا عقار | اخرج من وحدتك أسرع وبفلوس أكتر",
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
    title: "لينا عقار | اخرج من وحدتك أسرع وبفلوس أكتر",
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
    title: "لينا عقار | اخرج من وحدتك أسرع وبفلوس أكتر",
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
