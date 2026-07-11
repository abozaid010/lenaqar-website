"use client";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const Header = ({ clientName, clientID, clientEmail }) => {
  const { translate, locale } = useI18n();
  const queryClient = useQueryClient();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = () => {
    if (typeof window !== "undefined" && window.toggleSidebar) {
      window.toggleSidebar();
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setIsUserMenuOpen(false);
  };

  const sendMessageWhatsApp = () => {
    const phoneNumber = "201556720323";
    const url = `https://wa.me/${phoneNumber}`;
    window.open(url, "_blank");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    try {
      await fetch("/api/auth/clear-session", {
        method: "POST",
        credentials: "include",
      });
      LenaCookiesManager.clearAuthCookies();

      // Clear expensive API cache (data projection) - both localStorage and TanStack Query cache
      if (typeof window !== "undefined") {


        // Also clear TanStack Query cache for data-projection
        queryClient.removeQueries({ queryKey: ["data-projection"] });
      }

      // Wait a brief moment to ensure cookies are cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Show success message
      toast.success(translate("header.logoutSuccess"));
    } catch (error) {
      console.error("Logout error:", error?.message);
    } finally {
      window.location.href = "/";
    }
  };

  const visibleClientId = clientID || LenaCookiesManager.getClientId();

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between lg:justify-end items-center no-print">
      <div className="block lg:hidden">
        <button
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={handleMenuClick}
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 ">
        <button
          onClick={sendMessageWhatsApp}
          className="flex items-center gap-2 h-10 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium px-4 sm:px-6 rounded-md shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 ${locale === "ar" ? "rotate-y-180" : ""}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span>{translate("header.sendMessage")}</span>
        </button>

        <LanguageSwitcher />

        <div className="relative">
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center focus:outline-none gap-2"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="h-8 w-8 cursor-pointer bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm cursor-pointer font-medium text-gray-700 hidden sm:inline">
              {clientName}
            </span>
          </button>

          {isUserMenuOpen && (
            <div
              className={`absolute mt-2 ${locale === "ar" ? "left-0" : "right-0"} w-52 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden`}
            >
              {visibleClientId ? (
                <Link
                  href={`/${visibleClientId}`}
                  className="text-base w-full font-medium text-gray-900 hover:bg-gray-200 py-2 px-4 flex items-center gap-3"
                >
                  <Settings className="h-4 w-4" />
                  {translate("header.userMenu.settings")}
                </Link>
              ) : (
                <button
                  onClick={() => toast.error("Please login again to view settings")}
                  className="text-base w-full font-medium text-gray-900 hover:bg-gray-200 py-2 px-4 flex items-center gap-3 text-left"
                >
                  <Settings className="h-4 w-4" />
                  {translate("header.userMenu.settings")}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="text-base flex items-center w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 transition-colors duration-150 gap-3"
              >
                <LogOut className="h-4 w-4" />
                {translate("header.userMenu.logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {translate("header.logoutConfirm.title")}
            </h3>
            <p className="text-gray-600 mb-6">
              {translate("header.logoutConfirm.message")}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                {translate("header.logoutConfirm.cancel")}
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {translate("header.logoutConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
