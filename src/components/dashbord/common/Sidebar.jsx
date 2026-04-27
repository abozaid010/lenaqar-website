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
import { useQuery } from "@tanstack/react-query";

import { useI18n } from "@/hooks/useI18n";
import { getProfileData } from "@/utils/api";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { SELECTION_COLORS } from "@/constants/colors";
import { useUnitsSectionSource } from "@/hooks/use-units-section-source";
import { useCampaignChatAccess } from "@/hooks/useCampaignChatAccess";
import { useModuleActions } from "@/hooks/useModuleActions";
import { isCurrentUserKingAdmin } from "@/lib/kingAdmin.client";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";

const SIDEBAR_BRAND_LOG = "[SidebarBrand]";

const SidebarComponent = ({
  canAccessMap = false,
  canAccessNews = false,
  initialModuleActions = undefined,
  clientId = null,
}) => {
  const { t, translate, locale } = useI18n();
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

  const isKingAdminUser = isCurrentUserKingAdmin();
  const {
    data: profilePayload,
    status: profileQueryStatus,
    fetchStatus: profileFetchStatus,
    isError: profileIsError,
    error: profileError,
    isFetched: profileIsFetched,
  } = useQuery({
    queryKey: ["clientProfile", "sidebarBrand"],
    queryFn: getProfileData,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !isKingAdminUser,
  });

  const clientLogoUrl =
    profilePayload?.data?.logo_url ??
    profilePayload?.data?.logo ??
    profilePayload?.logo_url;

  useEffect(() => {
    setBrandImgFailed(false);
  }, [clientLogoUrl]);

  const showClientLogo =
    !isKingAdminUser &&
    typeof clientLogoUrl === "string" &&
    clientLogoUrl.trim() !== "" &&
    !brandImgFailed;

  useEffect(() => {
    const displayUrl =
      typeof clientLogoUrl === "string" && clientLogoUrl.trim()
        ? getDisplayImageUrl(clientLogoUrl)
        : null;
    console.log(SIDEBAR_BRAND_LOG, {
      clientIdFromLayout: clientId,
      clientIdFromCookie: LenaCookiesManager.getClientId(),
      isKingAdminUser,
      profileQueryEnabled: !isKingAdminUser,
      profileQueryStatus,
      profileFetchStatus,
      profileIsFetched,
      profileIsError,
      profileError: profileIsError
        ? profileError?.message ?? String(profileError)
        : undefined,
      profilePayloadType: profilePayload == null ? typeof profilePayload : "object",
      profileApiErrorField:
        profilePayload && typeof profilePayload === "object"
          ? profilePayload.error
          : undefined,
      profileTopKeys:
        profilePayload && typeof profilePayload === "object"
          ? Object.keys(profilePayload)
          : [],
      profileDataKeys:
        profilePayload?.data && typeof profilePayload.data === "object"
          ? Object.keys(profilePayload.data)
          : [],
      clientLogoUrlRaw: clientLogoUrl,
      displayUrlAfterRewrite: displayUrl,
      showClientLogo,
      brandImgFailed,
    });
  }, [
    clientId,
    isKingAdminUser,
    profilePayload,
    profileQueryStatus,
    profileFetchStatus,
    profileIsFetched,
    profileIsError,
    profileError,
    clientLogoUrl,
    showClientLogo,
    brandImgFailed,
  ]);

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
                {t.sidebar.logoutConfirm.title}
              </h3>
              <p className="text-gray-600 mt-2">
                {t.sidebar.logoutConfirm.message}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelLogout}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
              >
                {t.sidebar.logoutConfirm.cancel}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md font-medium transition-colors"
              >
                {t.sidebar.logoutConfirm.confirm}
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
          <Link href="/" className="text-xl font-bold flex items-center">
            {showClientLogo ? (
              <img
                src={getDisplayImageUrl(clientLogoUrl)}
                alt=""
                className="max-h-10 w-auto max-w-[7.5rem] object-contain"
                onError={() => setBrandImgFailed(true)}
              />
            ) : (
              <Image
                src="/images/logo.png"
                alt="logo_image"
                width={120}
                height={40}
              />
            )}
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
              <span>{t.sidebar.dashboard}</span>
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
              <span>{t.sidebar.units}</span>
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
              <span>{t.sidebar.pendingApproval ?? "Resale"}</span>
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
              <span>{t.sidebar.team}</span>
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
              <span>{t.sidebar.myProjects}</span>
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
              <span>{t.sidebar.developers}</span>
            </Link>
          )}

          {isMounted && canAccessNews && news.canView && (
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
              <span>{t.sidebar.news}</span>
            </Link>
          )}

          {isMounted && canAccessMap && map.canView && (
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
              <span>{t.sidebar.map}</span>
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
