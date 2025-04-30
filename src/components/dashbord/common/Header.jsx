"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  User,
  MessageSquare,
  Menu,
  LogOut,
  Settings,
} from "lucide-react";
import { LanguageSwitcher } from "../../ui/LanguageSwitcher";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useI18n } from "@/context/translate-api";

const Header = ({ clientName }) => {
  const { t } = useI18n();
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

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    Cookies.remove("client_id");
    setShowLogoutConfirm(false);
    toast.success(t.header.logoutSuccess);
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center mt-2 md:mt-0">
      <div className="flex items-center gap-3">
        <div className="block lg:hidden">
          <button
            className="p-1 rounded-md hover:bg-gray-100"
            onClick={handleMenuClick}
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        <div className="sm:hidden">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <LanguageSwitcher />

        <div className="relative hidden sm:block">
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
            <MessageSquare className="h-6 w-6" />
          </button>
        </div>

        <div className="relative">
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center focus:outline-none"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="h-8 w-8 cursor-pointer bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <span className="ml-2 text-sm cursor-pointer font-medium text-gray-700 hidden sm:inline">
              {clientName}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 relative">
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                <p className="text-sm font-medium text-gray-900">
                  {clientName}
                </p>
              </div>

              <a className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150">
                <Settings className="h-4 w-4 mr-3" />
                {t.header.userMenu.settings}
              </a>

              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
              >
                <LogOut className="h-4 w-4 mr-3" />
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