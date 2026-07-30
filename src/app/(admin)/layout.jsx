import Sidebar from "@/components/dashbord/common/Sidebar";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";
import ModuleActionsProvider from "@/components/auth/ModuleActionsProvider";
import ActionCatalogWarmup from "@/components/actions/ActionCatalogWarmup";
import { Suspense } from "react";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getCachedClientProfile } from "@/lib/getCachedClientProfile.server";
import { extractModuleActionsFromProfile } from "@/lib/whatsapp-bulk-access";
import { getUnreadNotificationsCount } from "@/lib/notifications.server";
import { getLocationsCatalog } from "@/lib/locations/locations-catalog.server";
import PublicUnitHeader from "@/app/allProberties/_components/Header";

import { cookies, headers } from "next/headers";
import { safeCookieParse } from "@/utils/safeJsonParser";
import { SELECTION_COLORS } from "@/constants/colors";

/**
 * Anonymous viewers can open shareable unit detail URLs under this layout group
 * (proxy allowlists /{clientId}/units/{code}). Render a public shell — no Sidebar,
 * no profile fetch — so CRM chrome never leaks into privacy_mode.
 */
function isAnonymousUnitDetailPath(pathname, hasSession) {
  if (hasSession || !pathname) return false;
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length === 3 &&
    segments[1] === "units" &&
    segments[2] !== "pending-approval"
  ) {
    return true;
  }
  if (
    segments.length === 2 &&
    segments[0] === "units" &&
    segments[1] !== "pending-approval"
  ) {
    return true;
  }
  return false;
}

const Layout = async ({ children }) => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const browserPathname = headerStore.get("x-lena-pathname") || "";
  const refreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
  const hasSession = Boolean(refreshToken);

  if (isAnonymousUnitDetailPath(browserPathname, hasSession)) {
    return (
      <>
        <PublicUnitHeader />
        <main className="mt-20 min-h-screen bg-gray-50">{children}</main>
      </>
    );
  }

  // Get the clientID from the cookie on the server then pass it to the Sidebar
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

  // Warm locations catalog once per server TTL — do not block the admin shell.
  void getLocationsCatalog().catch((err) => {
    console.warn(
      "[admin/layout] locations catalog warm failed:",
      err?.response?.status || err?.message || err
    );
  });

  const initialModuleActions = extractModuleActionsFromProfile(profileResponse);

  // I18nProvider lives in the root layout only (avoids nested providers + dual locale loads).

  return (
    <TokenRefreshProvider>
      <ModuleActionsProvider initialModuleActions={initialModuleActions}>
        <ActionCatalogWarmup />
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
