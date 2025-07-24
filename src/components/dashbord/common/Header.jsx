"use client";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/context/translate-api";
import Cookies from "js-cookie";
import { Bell, HelpCircle, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const Header = ({ clientName, clientID, clientEmail }) => {
  const { t, locale } = useI18n();

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
    console.log("WhatsApp message button clicked");
    // const phoneNumber = "201016080323";
    // const url = `https://wa.me/${phoneNumber}`;
    // window.open(url, "_blank");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    try {
      // Remove cookies first
      Cookies.remove("lena-website-client_id");
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");

      // Wait a brief moment to ensure cookies are cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Show success message
      toast.success(t.header.logoutSuccess);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = "/";
    }
  };

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
          className="flex items-center gap-2 bg-primary text-white font-medium px-[16px] py-[10px] h-[40px] sm:px-6 rounded-md shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none"
        >
          <HelpCircle
            size={20}
            className={`${locale === "ar" ? "rotate-y-180" : ""}`}
          />
          <span>{t.header.sendMessage}</span>
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
              <Link
                href={`/client/${clientEmail}`}
                className="text-base w-full font-medium text-gray-900 hover:bg-gray-200 py-2 px-4 flex items-center gap-3"
              >
                <Settings className="h-4 w-4" />
                {t.header.userMenu.settings}
              </Link>

              <button
                onClick={handleLogout}
                className="text-base flex items-center w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 transition-colors duration-150 gap-3"
              >
                <LogOut className="h-4 w-4" />
                {t.header.userMenu.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t.header.logoutConfirm.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {t.header.logoutConfirm.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t.header.logoutConfirm.cancel}
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {t.header.logoutConfirm.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
