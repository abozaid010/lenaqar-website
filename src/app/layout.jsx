import { I18nProvider } from "@/context/translate-api";
import TanStackQueryProvider from "@/providers/query-client-provider";
import { Cairo, Montserrat } from "next/font/google";
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

/**
 * Arabic-only, and deliberately not `async`.
 *
 * Reading the `lang` cookie here opted every route into dynamic rendering, which
 * cost TTFB on the listing pages and made `notFound()` resolve after the stream
 * had already committed HTTP 200. The cookie no longer decides anything: the CRM
 * (the only English consumer) is gone, there is no language switcher, and
 * `LenaqarLocale` forces `ar` on every public page.
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang={SITE.htmlLang}
      className={`${montserrat.variable} ${cairo.className}`}
      dir={SITE.dir}
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
        <I18nProvider initialLocal="ar">
          <Toaster position="top-center" reverseOrder={false} />
          <TanStackQueryProvider>
            <MetaPixelProvider>{children}</MetaPixelProvider>
          </TanStackQueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
