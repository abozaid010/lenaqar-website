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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useI18n } from "@/context/translate-api";
import { SELECTION_COLORS } from "@/constants/colors";

const Sidebar = () => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState(null);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const cancelLogout = () => setShowLogoutConfirm(false);
  
  // Handle navigation with optimistic UI
  const handleNavigation = (href, e) => {
    e.preventDefault();
    setPendingPath(href); // Immediate visual feedback
    
    startTransition(() => {
      router.push(href);
      // Pending state will be cleared by useEffect when pathname changes
    });
  };

  const isLinkActive = (path) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    return pathname.startsWith(path) && path !== "/dashboard";
  };

  if (typeof window !== "undefined") {
    window.toggleSidebar = toggleSidebar;
  }

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // Clear pending state when pathname changes (navigation completed)
    if (pendingPath && pathname === pendingPath) {
      setPendingPath(null);
    }
  }, [pathname, isOpen, pendingPath]);

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
                onClick={() => {
                  // Logout functionality should be handled in Header component
                  setShowLogoutConfirm(false);
                }}
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
        <div className="p-4 mt-1 ">
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
          <Link
            href="/dashboard"
            prefetch={true}
            onClick={(e) => handleNavigation("/dashboard", e)}
            className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
              isLinkActive("/dashboard") || pendingPath === "/dashboard"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/dashboard" ? "opacity-70" : ""}`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span>{t.sidebar.dashboard}</span>
            {isPending && pendingPath === "/dashboard" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/campaigns"
            prefetch={true}
            onClick={(e) => handleNavigation("/campaigns", e)}
            className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
              isLinkActive("/campaigns") || pendingPath === "/campaigns"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/campaigns" ? "opacity-70" : ""}`}
          >
            <Megaphone className="h-5 w-5 mr-3" />
            <span>{t.sidebar.campaigns || "Campaigns"}</span>
            {isPending && pendingPath === "/campaigns" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/schedule"
            prefetch={true}
            onClick={(e) => handleNavigation("/schedule", e)}
            className={`flex items-center px-4 py-2  mb-1 gap-2 transition-colors relative ${
              isLinkActive("/schedule") || pendingPath === "/schedule"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/schedule" ? "opacity-70" : ""}`}
          >
            <Calendar className="h-5 w-5 mr-3" />
            <span>{t.sidebar.schedule || "Schedule"}</span>
            {isPending && pendingPath === "/schedule" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/analytics"
            prefetch={true}
            onClick={(e) => handleNavigation("/analytics", e)}
            className={`flex items-center px-4 py-2  mb-1 gap-2 transition-colors relative ${
              isLinkActive("/analytics") || pendingPath === "/analytics"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/analytics" ? "opacity-70" : ""}`}
          >
            <BarChart2 className="h-5 w-5 mr-3" />
            <span>{t.sidebar.analytics}</span>
            {isPending && pendingPath === "/analytics" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/units"
            prefetch={true}
            onClick={(e) => handleNavigation("/units", e)}
            className={`flex items-center px-4 py-2  mb-1 gap-2 transition-colors relative ${
              isLinkActive("/units") || pendingPath === "/units"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/units" ? "opacity-70" : ""}`}
          >
            <Home className="h-5 w-5 mr-3" />
            <span>{t.sidebar.units}</span>
            {isPending && pendingPath === "/units" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/team"
            prefetch={true}
            onClick={(e) => handleNavigation("/team", e)}
            className={`flex items-center px-4 py-2  mb-1 gap-2 transition-colors relative ${
              isLinkActive("/team") || pendingPath === "/team"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/team" ? "opacity-70" : ""}`}
          >
            <Users2 className="h-5 w-5 mr-3" />
            <span>{t.sidebar.team}</span>
            {isPending && pendingPath === "/team" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>
          
          <Link
            href="/myProjects"
            prefetch={true}
            onClick={(e) => handleNavigation("/myProjects", e)}
            className={`flex items-center px-4 py-2  mb-1 gap-2 transition-colors relative ${
              isLinkActive("/myProjects") || pendingPath === "/myProjects"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/myProjects" ? "opacity-70" : ""}`}
          >
            <FolderKanban className="h-5 w-5 mr-3" />
            <span>{t.sidebar.myProjects}</span>
            {isPending && pendingPath === "/myProjects" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/developers"
            prefetch={true}
            onClick={(e) => handleNavigation("/developers", e)}
            className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
              isLinkActive("/developers") || pendingPath === "/developers"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/developers" ? "opacity-70" : ""}`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span>{t.sidebar.developers}</span>
            {isPending && pendingPath === "/developers" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/news"
            prefetch={true}
            onClick={(e) => handleNavigation("/news", e)}
            className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
              isLinkActive("/news") || pendingPath === "/news"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/news" ? "opacity-70" : ""}`}
          >
            <Newspaper className="h-5 w-5 mr-3" />
            <span>{t.sidebar.news}</span>
            {isPending && pendingPath === "/news" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>

          <Link
            href="/map"
            prefetch={true}
            onClick={(e) => handleNavigation("/map", e)}
            className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative ${
              isLinkActive("/map") || pendingPath === "/map"
                ? SELECTION_COLORS.SELECTED
                : "text-gray-700 hover:bg-gray-100"
            } ${isPending && pendingPath === "/map" ? "opacity-70" : ""}`}
          >
            <MapPin className="h-5 w-5 mr-3" />
            <span>{t.sidebar.map}</span>
            {isPending && pendingPath === "/map" && (
              <Loader2 className="h-4 w-4 ml-auto animate-spin" />
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
