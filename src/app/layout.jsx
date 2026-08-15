import { I18nProvider } from "@/context/translate-api";
import TanStackQueryProvider from "@/providers/query-client-provider";
import { Cairo, Montserrat } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { defaultMetadata } from "./metadata";
import OrganizationSchema from "@/components/schema/OrganizationSchema";
import LocalBusinessSchema from "@/components/schema/LocalBusinessSchema";
import WebSiteSchema from "@/components/schema/WebSiteSchema";
import { getGAScriptUrl, getGAConfig } from '@/constants/analytics';
import MetaPixelNoscript from "@/components/analytics/MetaPixelNoscript";
import MetaPixelProvider from "@/components/analytics/MetaPixelProvider";
import Script from "next/script";
import { SITE } from "@/config/site";

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
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang")?.value;
  const supportedLocales = ["en", "ar"];
  const initialLocale =
    langCookie && supportedLocales.includes(langCookie) ? langCookie : "ar";

  const htmlLang = initialLocale === "ar" ? SITE.htmlLang : initialLocale;
  const htmlDir = initialLocale === "ar" ? SITE.dir : "ltr";

  return (
    <html
      lang={htmlLang}
      className={`${montserrat.variable} ${cairo.className}`}
      dir={htmlDir}
    >
      <head>
        <Script
          src={getGAScriptUrl()}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${getGAConfig()}', {
              page_location: window.location.href
            });
          `}
        </Script>
      </head>
      <body>
        <MetaPixelNoscript />
        <OrganizationSchema />
        <LocalBusinessSchema />
        <WebSiteSchema />
        <I18nProvider initialLocal={initialLocale}>
          <Toaster position="top-center" reverseOrder={false} />
          <TanStackQueryProvider>
            <MetaPixelProvider>{children}</MetaPixelProvider>
          </TanStackQueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
