"use client";

import {
  AlertTriangle,
  BarChart2,
  Calendar,
  Megaphone,
  FolderKanban,
  Home,
  LayoutDashboard,
  Users2,
  Loader2,
  Newspaper,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useI18n } from "@/hooks/useI18n";
import { getProfileData } from "@/utils/api";
import { getClientLogoDisplayUrl } from "@/utils/imageUtils";
import { SELECTION_COLORS } from "@/constants/colors";
import { useUnitsSectionSource } from "@/hooks/use-units-section-source";
import { useCampaignChatAccess } from "@/hooks/useCampaignChatAccess";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useModuleActionsContext } from "@/context/module-actions-context";
import { isCurrentUserKingAdmin } from "@/lib/kingAdmin.client";
import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { extractModuleActionsFromProfile } from "@/lib/whatsapp-bulk-access";
import { seedMessagingProviderConfigCache } from "@/hooks/useMessagingProviderConfig";

const SidebarComponent = ({
  clientId = null,
  /** Full profile API envelope from RSC (cached); avoids duplicate first client fetch */
  serverProfileInitial = null,
  /** Server-provided display name (fallback until profile loads) */
  clientName = null,
}) => {
  const { translate, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const unitsSection = useUnitsSectionSource();
  const [isOpen, setIsOpen] = useState(false);
  const [canAccessCampaignChat, setCanAccessCampaignChat] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [brandImgFailed, setBrandImgFailed] = useState(false);
  const currentClientId = clientId || LenaCookiesManager.getClientId() || null;
  const queryClient = useQueryClient();

  // Profile API is the source of truth for `module_actions` (not embedded in JWT in v2).
  const { setModuleActions } = useModuleActionsContext();

  const isKingAdminUser = isCurrentUserKingAdmin();
  const {
    data: profilePayload,
    isError: isProfileError,
    error: profileError,
  } = useQuery({
    queryKey: ["clientProfile", "sidebarBrand", currentClientId || "unknown-client"],
    queryFn: getProfileData,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: true,
    ...(serverProfileInitial != null
      ? {
          initialData: serverProfileInitial,
          initialDataUpdatedAt: Date.now(),
          refetchOnMount: false,
        }
      : {}),
  });

  const pd = profilePayload?.data;

  // Sync profile module_actions into context so all useModuleActions hooks
  // use the configured access list, not the JWT's owner-expanded list.
  useEffect(() => {
    const profileModuleActions = extractModuleActionsFromProfile(profilePayload);
    if (profileModuleActions) {
      setModuleActions(profileModuleActions);
    }
  }, [profilePayload, setModuleActions]);

  // Reuse login-time profile (server RSC or sidebar cache) for WhatsApp send — no extra browser GET until stale.
  useEffect(() => {
    if (!profilePayload) return;
    seedMessagingProviderConfigCache(queryClient, currentClientId, profilePayload, {
      source: serverProfileInitial != null ? "server_rsc" : "sidebar_profile",
    });
  }, [profilePayload, currentClientId, queryClient, serverProfileInitial]);

  const profileClientId =
    pd?.client_id ??
    pd?.clientId ??
    profilePayload?.client_id ??
    profilePayload?.clientId ??
    null;
  const isProfileClientMatch =
    !currentClientId || !profileClientId || String(currentClientId) === String(profileClientId);

  const clientLogoUrl =
    pd?.logo_url ??
    pd?.logo ??
    pd?.client_logo_url ??
    pd?.client_logo ??
    profilePayload?.logo_url ??
    profilePayload?.logo;

  const resolvedClientName =
    pd?.client_name ??
    pd?.clientName ??
    profilePayload?.client_name ??
    profilePayload?.clientName ??
    clientName ??
    null;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("[SidebarLogo] profile query snapshot", {
      isKingAdminUser,
      hasProfilePayload: Boolean(profilePayload),
      payloadKeys:
        profilePayload && typeof profilePayload === "object"
          ? Object.keys(profilePayload)
          : [],
      dataKeys:
        pd && typeof pd === "object"
          ? Object.keys(pd)
          : [],
      extractedClientLogoUrl: clientLogoUrl || null,
    });
  }, [isKingAdminUser, profilePayload, pd, clientLogoUrl]);

  // Persist latest profile logo into client_info cookie so branding is available
  // immediately across app sections that read client_info on startup.
  useEffect(() => {
    if (!profilePayload) return;
    const logoUrl =
      pd?.logo_url ??
      pd?.logo ??
      pd?.client_logo_url ??
      pd?.client_logo ??
      profilePayload?.logo_url ??
      profilePayload?.logo ??
      "";
    if (!isProfileClientMatch) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[SidebarLogo] profile/cookie client mismatch, skip cookie persist", {
          cookieClientId: currentClientId,
          profileClientId,
        });
      }
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[SidebarLogo] persist logo step", {
        rawLogoUrl: logoUrl || null,
      });
    }
    if (!logoUrl) return;

    const currentInfo = LenaCookiesManager.getClientInfo() || {};
    if (process.env.NODE_ENV === "development") {
      console.log("[SidebarLogo] cookie before persist", {
        currentClientInfoLogo: currentInfo.logo_url || null,
        currentClientInfoName: currentInfo.client_name || null,
      });
    }
    if (
      currentInfo.logo_url === logoUrl &&
      (!pd?.client_name || currentInfo.client_name === pd.client_name)
    ) {
      return;
    }
    LenaCookiesManager.setClientInfo({
      ...currentInfo,
      ...(profileClientId ? { client_id: profileClientId } : null),
      ...(pd?.client_name ? { client_name: pd.client_name } : null),
      logo_url: logoUrl,
    });
    if (process.env.NODE_ENV === "development") {
      const updatedInfo = LenaCookiesManager.getClientInfo() || {};
      console.log("[SidebarLogo] cookie after persist", {
        updatedClientInfoClientId: updatedInfo.client_id || null,
        updatedClientInfoName: updatedInfo.client_name || null,
        updatedClientInfoLogo: updatedInfo.logo_url || null,
      });
    }
  }, [profilePayload, pd, currentClientId, isProfileClientMatch, profileClientId]);

  useEffect(() => {
    setBrandImgFailed(false);
  }, [clientLogoUrl]);

  const showClientLogo =
    typeof clientLogoUrl === "string" &&
    clientLogoUrl.trim() !== "" &&
    !brandImgFailed;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("[SidebarLogo] render decision", {
      isKingAdminUser,
      currentClientId,
      profileClientId,
      isProfileClientMatch,
      clientLogoUrl: clientLogoUrl || null,
      brandImgFailed,
      showClientLogo,
      fallbackLogoWillRender: !showClientLogo,
      resolvedDisplayUrl: clientLogoUrl
        ? getClientLogoDisplayUrl(clientLogoUrl)
        : null,
    });
  }, [
    isKingAdminUser,
    currentClientId,
    profileClientId,
    isProfileClientMatch,
    clientLogoUrl,
    brandImgFailed,
    showClientLogo,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!isProfileError) return;
    console.error("[SidebarLogo] profile query failed", {
      currentClientId,
      errorMessage: profileError?.message || String(profileError),
      error: profileError,
    });
  }, [isProfileError, profileError, currentClientId]);

  const { canAccessCampaignChat: hasAccess } = useCampaignChatAccess();

  const conversation = useModuleActions("conversation");
  const campaign = useModuleActions("campaign");
  const chatCampaign = useModuleActions("chat_campaign");
  const calendar = useModuleActions("calendar");
  const analytics = useModuleActions("analytics");
  const units = useModuleActions("units");
  const resale = useModuleActions("resale");
  const teamMembers = useModuleActions("team_members");
  const projects = useModuleActions("projects");
  const developers = useModuleActions("developers");
  const news = useModuleActions("news");
  const map = useModuleActions("map");

  // Build prefixed nav href
  const prefix = clientId ? `/${clientId}` : '';
  const navHref = (path) => `${prefix}${path}`;

  const toggleSidebar = () => setIsOpen(!isOpen);
  const cancelLogout = () => setShowLogoutConfirm(false);

  
  // Strip clientId prefix for active-link comparison
  const normalizePathname = () => {
    if (clientId && pathname.startsWith(`/${clientId}`)) {
      return pathname.slice(`/${clientId}`.length) || '/';
    }
    return pathname;
  };

  const isLinkActive = (path) => {
    const norm = normalizePathname();
    if (path === "/dashboard") return norm === "/dashboard";
    return norm.startsWith(path);
  };

  const isUnitsLinkActive = unitsSection === "units";
  const isPendingApprovalLinkActive = unitsSection === "pending_approval";

  const isRTL = String(locale || "").toLowerCase().startsWith("ar");
  const drawerSideClass = isRTL ? "right-0" : "left-0";
  const drawerTransformClass = isOpen
    ? "translate-x-0"
    : isRTL
      ? "translate-x-full lg:translate-x-0"
      : "-translate-x-full lg:translate-x-0";

  if (typeof window !== "undefined") {
    window.toggleSidebar = toggleSidebar;
  }

  useEffect(() => {
    setIsMounted(true);
    if (pendingPath && pathname === pendingPath) setPendingPath(null);
    setCanAccessCampaignChat(hasAccess);
  }, [pathname, pendingPath, hasAccess]);

  // Close the mobile drawer on route change
  useEffect(() => {
    if (isOpen) setIsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      ></div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 m-4 animate-fade-in">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {translate("sidebar.logoutConfirm.title")}
              </h3>
              <p className="text-gray-600 mt-2">
                {translate("sidebar.logoutConfirm.message")}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelLogout}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
              >
                {translate("sidebar.logoutConfirm.cancel")}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md font-medium transition-colors"
              >
                {translate("sidebar.logoutConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar content */}
      <div
        className={`w-[12.0rem] h-full bg-white text-gray-700 flex flex-col fixed lg:static z-50 transition-transform duration-300 shadow-md transform ${drawerSideClass} ${drawerTransformClass}`}
      >
        {/* Logo/Brand */}
        <div className="p-4 mt-1">
          <Link href="/" className="block w-full">
            <div className="w-full flex flex-col items-center">
              {showClientLogo ? (
                <img
                  src={getClientLogoDisplayUrl(clientLogoUrl)}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover ring-1 ring-gray-200 bg-white"
                  onLoad={(e) => {
                    if (process.env.NODE_ENV === "development") {
                      console.log("[SidebarLogo] image loaded", {
                        renderedSrc: e.currentTarget?.currentSrc || e.currentTarget?.src || null,
                      });
                    }
                  }}
                  onError={(e) => {
                    if (process.env.NODE_ENV === "development") {
                      console.error("[SidebarLogo] image failed", {
                        renderedSrc: e.currentTarget?.currentSrc || e.currentTarget?.src || null,
                        originalClientLogoUrl: clientLogoUrl || null,
                      });
                    }
                    setBrandImgFailed(true);
                  }}
                />
              ) : (
                <Image
                  src="/images/logo.png"
                  alt="logo_image"
                  width={160}
                  height={60}
                  className="w-20 h-20 rounded-full object-cover ring-1 ring-gray-200 bg-white"
                />
              )}

              {resolvedClientName ? (
                <div className="mt-2 w-full text-center">
                  <p className="text-xs font-semibold text-gray-700 leading-snug break-words">
                    {resolvedClientName}
                  </p>
                </div>
              ) : null}
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 ${SELECTION_COLORS.BG}`}>
          {isMounted && conversation.canView && (
            <Link
              href={navHref("/dashboard")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/dashboard")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.dashboard")}</span>
            </Link>
          )}

          {isMounted && campaign.canView && (
            <Link
              href={navHref("/campaigns")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/campaigns")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Megaphone className="h-5 w-5 mr-3" />
              <span>{translate('sidebar.campaigns')}</span>
            </Link>
          )}

          {isMounted && canAccessCampaignChat && chatCampaign.canView && (
            <Link
              href={navHref("/campaign-chat")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/campaign-chat")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              <span>{translate('sidebar.campaignChat')}</span>
            </Link>
          )}

          {isMounted && calendar.canView && (
            <Link
              href={navHref("/schedule")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/schedule")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Calendar className="h-5 w-5 mr-3" />
              <span>{translate('sidebar.schedule')}</span>
            </Link>
          )}

          {isMounted && analytics.canView && (
            <Link
              href={navHref("/analytics")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/analytics")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart2 className="h-5 w-5 mr-3" />
              <span>{translate('sidebar.analytics')}</span>
            </Link>
          )}

          {isMounted && units.canView && (
            <Link
              href={navHref("/units")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isUnitsLinkActive
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Home className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.units")}</span>
            </Link>
          )}

          {isMounted && resale.canView && (
            <Link
              href={navHref("/units/pending-approval")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isPendingApprovalLinkActive
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Home className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.pendingApproval")}</span>
            </Link>
          )}

          {isMounted && teamMembers.canView && (
            <Link
              href={navHref("/team")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/team")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users2 className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.team")}</span>
            </Link>
          )}

          {isMounted && isCurrentUserKingAdmin() && (
            <Link
              href={navHref("/clients")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/clients")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users2 className="h-5 w-5 mr-3" />
              <span>{translate('sidebar.clients')}</span>
            </Link>
          )}

          {isMounted && projects.canView && (
            <Link
              href={navHref("/myProjects")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/myProjects")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FolderKanban className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.myProjects")}</span>
            </Link>
          )}

          {isMounted && developers.canView && (
            <Link
              href={navHref("/developers")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/developers")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.developers")}</span>
            </Link>
          )}

          {isMounted && news.canView && (
            <Link
              href={navHref("/news")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/news")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Newspaper className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.news")}</span>
            </Link>
          )}

          {isMounted && map.canView && (
            <Link
              href={navHref("/map")}
              prefetch={true}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/map")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MapPin className="h-5 w-5 mr-3" />
              <span>{translate("sidebar.map")}</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

const Sidebar = (props) => {
  return (
    <SearchParamsWrapper>
      <SidebarComponent {...props} />
    </SearchParamsWrapper>
  );
};

export default Sidebar;
