import { I18nProvider } from "@/context/translate-api";
import { Cairo, Montserrat } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-montserrat",
});

const cairo = Cairo({
  weight: "500",
  subsets: ["latin"],
});

export const metadata = {
  title: "LENAAI | AI-Powered Real Estate CRM System",
  description:
    "Streamline your real estate business with LENAAI's AI-powered CRM. Automate WhatsApp communications, boost sales, and enhance client relationships.",
  keywords:
    "real estate CRM, AI sales agent, WhatsApp automation, property management, chatbot for real estate, AI real estate automation",
  openGraph: {
    title: "LENAAI | AI-Powered Real Estate CRM System",
    description:
      "Streamline your real estate business with LENAAI's AI-powered CRM. Automate WhatsApp communications, boost sales, and enhance client relationships.",
    type: "website",
    locale: "en_US",
    url: "https://www.lenaai.net/",
    siteName: "LENAAI",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "LENAAI Real Estate CRM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LENAAI | AI-Powered Real Estate CRM System",
    description:
      "Streamline your real estate business with LENAAI's AI-powered CRM. Automate WhatsApp communications, boost sales, and enhance client relationships.",
    images: ["/images/lenaai-twitter-image.jpg"],
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
    canonical: "https://www.lenaai.net",
    // TODO: each language should have its own path
    languages: {
      en: "https://www.lenaai.net",
      ar: "https://www.lenaai.net",
    },
  },
};

export default async function RootLayout({ children }) {
  // Get the initial locale from the cookie on the server
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang")?.value;

  // Get Accept-Language header from the request
  const headersStore = await headers();
  const acceptLanguage = headersStore.get("accept-language");
  const supportedLocales = ["en", "ar"];
  const defaultLocale = "ar";

  // Parse the preferred locale from Accept-Language
  let initialLocale = defaultLocale;
  if (!langCookie && acceptLanguage) {
    const preferredLocales = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().toLowerCase());
    initialLocale =
      preferredLocales.find((loc) =>
        supportedLocales.includes(loc.split("-")[0])
      ) || defaultLocale;
  } else if (langCookie) {
    initialLocale = supportedLocales.includes(langCookie)
      ? langCookie
      : defaultLocale;
  }

  return (
    <html
      lang={initialLocale}
      className={`${montserrat.variable} ${cairo.className}`}
      dir={initialLocale === "ar" ? "rtl" : "ltr"}
    >
      <body>
        <I18nProvider initialLocal={initialLocale}>
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
