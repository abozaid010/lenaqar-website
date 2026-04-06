import { I18nProvider } from "@/context/translate-api";
import TanStackQueryProvider from "@/providers/query-client-provider";
import { Cairo, Montserrat } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { defaultMetadata } from "./metadata";
import OrganizationSchema from "@/components/schema/OrganizationSchema";
import LocalBusinessSchema from "@/components/schema/LocalBusinessSchema";
import WebSiteSchema from "@/components/schema/WebSiteSchema";
import { ANALYTICS, getGAScriptUrl, getGAConfig } from '@/constants/analytics';
import Script from "next/script";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-montserrat",
});

const cairo = Cairo({
  weight: "500",
  subsets: ["latin"],
});

export const metadata = defaultMetadata;

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
        <Script
          src={getGAScriptUrl()}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${getGAConfig()}');
          `}
        </Script>
        <OrganizationSchema />
        <LocalBusinessSchema />
        <WebSiteSchema />
        <I18nProvider initialLocal={initialLocale}>
          <Toaster position="top-center" reverseOrder={false} />
          <TanStackQueryProvider>{children}</TanStackQueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
