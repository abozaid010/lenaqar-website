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

import { useI18n } from "@/context/translate-api";
import { SELECTION_COLORS } from "@/constants/colors";
import { useUnitsSectionSource } from "@/hooks/use-units-section-source";
import { useCampaignChatAccess } from "@/hooks/useCampaignChatAccess";
import { useModuleActions } from "@/hooks/useModuleActions";
import { isCurrentUserKingAdmin } from "@/lib/kingAdmin";

const Sidebar = ({
  canAccessMap = false,
  canAccessNews = false,
  initialModuleActions = undefined,
  clientId = null,
}) => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const unitsSection = useUnitsSectionSource();
  const [isOpen, setIsOpen] = useState(false);
  const [canAccessCampaignChat, setCanAccessCampaignChat] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  const handleNavigation = (href, e) => {
    e.preventDefault();
    setPendingPath(href);
    startTransition(() => {
      router.push(href);
    });
  };

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

  if (typeof window !== "undefined") {
    window.toggleSidebar = toggleSidebar;
  }

  useEffect(() => {
    setIsMounted(true);
    if (isOpen) setIsOpen(false);
    if (pendingPath && pathname === pendingPath) setPendingPath(null);
    setCanAccessCampaignChat(hasAccess);
  }, [pathname, isOpen, pendingPath, hasAccess]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-10 transition-opacity duration-300 ${
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
        className={`w-[12.0rem] h-full bg-white text-gray-700 flex flex-col fixed lg:static z-10 transition-all duration-300 shadow-md ${
          isOpen ? "left-0" : "-left-[12.0rem] lg:left-0"
        }`}
      >
        {/* Logo/Brand */}
        <div className="p-4 mt-1">
          <Link href="/" className="text-xl font-bold flex items-center">
            <Image
              src="/images/logo.png"
              alt="logo_image"
              width={120}
              height={40}
            />
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 ${SELECTION_COLORS.BG}`}>
          {isMounted && conversation.canView && (
            <Link
              href={navHref("/dashboard")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/dashboard"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/dashboard") || pendingPath === navHref("/dashboard")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/dashboard") ? "opacity-70" : ""}`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>{t.sidebar.dashboard}</span>
              {isPending && pendingPath === navHref("/dashboard") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && campaign.canView && (
            <Link
              href={navHref("/campaigns")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/campaigns"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/campaigns") || pendingPath === navHref("/campaigns")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/campaigns") ? "opacity-70" : ""}`}
            >
              <Megaphone className="h-5 w-5 mr-3" />
              <span>{t.sidebar.campaigns || "Campaigns"}</span>
              {isPending && pendingPath === navHref("/campaigns") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && canAccessCampaignChat && chatCampaign.canView && (
            <Link
              href={navHref("/campaign-chat")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/campaign-chat"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/campaign-chat") || pendingPath === navHref("/campaign-chat")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/campaign-chat") ? "opacity-70" : ""}`}
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              <span>{t.sidebar.campaignChat || "Campaign Chat"}</span>
              {isPending && pendingPath === navHref("/campaign-chat") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && calendar.canView && (
            <Link
              href={navHref("/schedule")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/schedule"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/schedule") || pendingPath === navHref("/schedule")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/schedule") ? "opacity-70" : ""}`}
            >
              <Calendar className="h-5 w-5 mr-3" />
              <span>{t.sidebar.schedule || "Schedule"}</span>
              {isPending && pendingPath === navHref("/schedule") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && analytics.canView && (
            <Link
              href={navHref("/analytics")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/analytics"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/analytics") || pendingPath === navHref("/analytics")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/analytics") ? "opacity-70" : ""}`}
            >
              <BarChart2 className="h-5 w-5 mr-3" />
              <span>{t.sidebar.analytics}</span>
              {isPending && pendingPath === navHref("/analytics") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && units.canView && (
            <Link
              href={navHref("/units")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/units"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                (isUnitsLinkActive || pendingPath === navHref("/units"))
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/units") ? "opacity-70" : ""}`}
            >
              <Home className="h-5 w-5 mr-3" />
              <span>{t.sidebar.units}</span>
              {isPending && pendingPath === navHref("/units") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && resale.canView && (
            <Link
              href={navHref("/units/pending-approval")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/units/pending-approval"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isPendingApprovalLinkActive || pendingPath === navHref("/units/pending-approval")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/units/pending-approval") ? "opacity-70" : ""}`}
            >
              <Home className="h-5 w-5 mr-3" />
              <span>{t.sidebar.pendingApproval ?? "Resale"}</span>
              {isPending && pendingPath === navHref("/units/pending-approval") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && teamMembers.canView && (
            <Link
              href={navHref("/team")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/team"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/team") || pendingPath === navHref("/team")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/team") ? "opacity-70" : ""}`}
            >
              <Users2 className="h-5 w-5 mr-3" />
              <span>{t.sidebar.team}</span>
              {isPending && pendingPath === navHref("/team") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && isCurrentUserKingAdmin() && (
            <Link
              href={navHref("/clients")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/clients"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/clients") || pendingPath === navHref("/clients")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/clients") ? "opacity-70" : ""}`}
            >
              <Users2 className="h-5 w-5 mr-3" />
              <span>Clients</span>
              {isPending && pendingPath === navHref("/clients") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && projects.canView && (
            <Link
              href={navHref("/myProjects")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/myProjects"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/myProjects") || pendingPath === navHref("/myProjects")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/myProjects") ? "opacity-70" : ""}`}
            >
              <FolderKanban className="h-5 w-5 mr-3" />
              <span>{t.sidebar.myProjects}</span>
              {isPending && pendingPath === navHref("/myProjects") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && developers.canView && (
            <Link
              href={navHref("/developers")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/developers"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/developers") || pendingPath === navHref("/developers")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/developers") ? "opacity-70" : ""}`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>{t.sidebar.developers}</span>
              {isPending && pendingPath === navHref("/developers") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && canAccessNews && news.canView && (
            <Link
              href={navHref("/news")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/news"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/news") || pendingPath === navHref("/news")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/news") ? "opacity-70" : ""}`}
            >
              <Newspaper className="h-5 w-5 mr-3" />
              <span>{t.sidebar.news}</span>
              {isPending && pendingPath === navHref("/news") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}

          {isMounted && canAccessMap && map.canView && (
            <Link
              href={navHref("/map")}
              prefetch={true}
              onClick={(e) => handleNavigation(navHref("/map"), e)}
              className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
                isLinkActive("/map") || pendingPath === navHref("/map")
                  ? SELECTION_COLORS.SELECTED
                  : "text-gray-700 hover:bg-gray-100"
              } ${isPending && pendingPath === navHref("/map") ? "opacity-70" : ""}`}
            >
              <MapPin className="h-5 w-5 mr-3" />
              <span>{t.sidebar.map}</span>
              {isPending && pendingPath === navHref("/map") && (
                <Loader2 className="h-4 w-4 ml-auto animate-spin" />
              )}
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
