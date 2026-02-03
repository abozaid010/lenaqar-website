import Header from "@/components/dashbord/common/Header";
import Sidebar from "@/components/dashbord/common/Sidebar";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { I18nProvider } from "@/context/translate-api";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";
import { Suspense } from "react";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

import { cookies } from "next/headers";
import { safeCookieParse } from "@/utils/safeJsonParser";
import { SELECTION_COLORS } from "@/constants/colors";

const Layout = async ({ children }) => {
  // Get the clientID from the cookie on the server then pass it as a prop to the Header component => To avoid hydration issues
  const cookieStore = await cookies();
  const clientID = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  const clientName = clientInfoCookie
    ? safeCookieParse(clientInfoCookie, {})?.client_name
    : null;
  const clientEmail = safeCookieParse(clientInfoCookie, {})?.email;

  // Get the initial locale from the cookie
  const langCookie = cookieStore.get(COOKIE_KEYS.LANG)?.value;
  const supportedLocales = ["en", "ar"];
  const defaultLocale = "ar";
  const initialLocale = supportedLocales.includes(langCookie)
    ? langCookie
    : defaultLocale;

  return (
    <I18nProvider initialLocal={initialLocale}>
      <TokenRefreshProvider>
        <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
          <Sidebar />

          <div className="flex-1 flex flex-col overflow-hidden lg:pl-0">
            <Header
              clientName={clientName}
              clientID={clientID}
              clientEmail={clientEmail}
            />

            <main className={`overflow-y-auto p-3 relative flex-1 flex flex-col min-h-0 ${SELECTION_COLORS.BG}`}>
              <Suspense
                fallback={
                  <LoadingSpinner
                    message="Loading..."
                    containerClassName="flex items-center justify-center h-full"
                  />
                }
              >
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </TokenRefreshProvider>
    </I18nProvider>
  );
};

export default Layout;
