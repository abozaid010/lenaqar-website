import Sidebar from "@/components/dashbord/common/Sidebar";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";
import ModuleActionsProvider from "@/components/auth/ModuleActionsProvider";
import { Suspense } from "react";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getCachedClientProfile } from "@/lib/getCachedClientProfile.server";
import { extractModuleActionsFromProfile } from "@/lib/whatsapp-bulk-access";
import { getUnreadNotificationsCount } from "@/lib/notifications.server";

import { cookies } from "next/headers";
import { safeCookieParse } from "@/utils/safeJsonParser";
import { SELECTION_COLORS } from "@/constants/colors";

const Layout = async ({ children }) => {
  // Get the clientID from the cookie on the server then pass it to the Sidebar
  const cookieStore = await cookies();
  const clientID = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  const clientName = clientInfoCookie
    ? safeCookieParse(clientInfoCookie, {})?.client_name
    : null;

  // Independent server fetches — run in parallel (same error semantics per call).
  const [profileResponse, unreadNotificationsCount] = await Promise.all([
    getCachedClientProfile(),
    getUnreadNotificationsCount(),
  ]);
  const initialModuleActions = extractModuleActionsFromProfile(profileResponse);

  // I18nProvider lives in the root layout only (avoids nested providers + dual locale loads).

  return (
    <TokenRefreshProvider>
      <ModuleActionsProvider initialModuleActions={initialModuleActions}>
        <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
          <Sidebar
            serverProfileInitial={profileResponse}
            clientId={clientID}
            clientName={clientName}
            unreadNotificationsCount={unreadNotificationsCount}
          />

          <div className="flex-1 min-w-0 flex flex-col overflow-hidden lg:pl-0">
            <main
              className={`overflow-y-auto overflow-x-hidden p-3 pt-12 lg:pt-3 relative flex-1 flex flex-col min-h-0 min-w-0 ${SELECTION_COLORS.BG}`}
            >
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
      </ModuleActionsProvider>
    </TokenRefreshProvider>
  );
};

export default Layout;
