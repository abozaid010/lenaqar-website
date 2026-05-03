import Header from "@/components/dashbord/common/Header";
import Sidebar from "@/components/dashbord/common/Sidebar";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { I18nProvider } from "@/context/translate-api";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";
import ModuleActionsProvider from "@/components/auth/ModuleActionsProvider";
import { Suspense } from "react";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import {
  canManageTeamFromToken,
  getModuleActionsFromToken,
  getRoleFromToken,
} from "@/lib/getRoleFromToken";
import { getProfileData } from "@/utils/api";

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

  const canManageTeam = await canManageTeamFromToken();
  const role = await getRoleFromToken();
  const jwtModuleActions = await getModuleActionsFromToken();

  // The profile API is the authoritative source for which modules a client can access.
  // The JWT expands all modules for "owner" role regardless of the client's actual
  // configuration, so we prefer the profile's module_actions over the JWT's.
  let profileModuleActions = null;
  try {
    const profileResponse = await getProfileData();
    const ma = profileResponse?.data?.module_actions;
    if (ma && typeof ma === "object" && !Array.isArray(ma)) {
      profileModuleActions = ma;
    }
  } catch {
    // fall through — layout still works with JWT or role-based fallback
  }

  const initialModuleActions = profileModuleActions ?? jwtModuleActions;

  const canAccessResale =
    initialModuleActions != null
      ? Boolean(initialModuleActions.resale?.includes("view"))
      : false;
  const canAccessMap =
    initialModuleActions != null
      ? Boolean(initialModuleActions.map?.includes("view"))
      : canManageTeam || role?.toLowerCase() === "editor";
  const canAccessNews =
    initialModuleActions != null
      ? Boolean(initialModuleActions.news?.includes("view"))
      : canManageTeam || role?.toLowerCase() === "editor";

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
        <ModuleActionsProvider initialModuleActions={initialModuleActions}>
<div className="flex flex-col lg:flex-row h-screen bg-gray-50">
            <Sidebar
              canAccessMap={canAccessMap}
              canAccessNews={canAccessNews}
              canAccessResale={canAccessResale}
              initialModuleActions={initialModuleActions}
              clientId={clientID}
            />

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
        </ModuleActionsProvider>
      </TokenRefreshProvider>
    </I18nProvider>
  );
};

export default Layout;
