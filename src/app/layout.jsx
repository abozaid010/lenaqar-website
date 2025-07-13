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
  description: `LENAAI, your AI property consultant.`,
  title: "LENAAI",
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
