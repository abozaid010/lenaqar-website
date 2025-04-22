"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Moon,
  LayoutDashboard,
  BarChart2,
  Home,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();

  // This function can be called from the Header component
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const initiateLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    Cookies.remove("client_id");
    setShowLogoutConfirm(false);
    toast.success("Logout Successful");
    window.location.reload();
  };

  // Function to check if a link is active
  const isLinkActive = (path) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    return pathname.startsWith(path) && path !== "/dashboard";
  };

  if (typeof window !== "undefined") {
    window.toggleSidebar = toggleSidebar;
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`lg:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-10 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      ></div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <>
          {/* Overlay for popup */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm   z-50 flex items-center justify-center">
            {/* Popup container */}
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 m-4 animate-fade-in">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Are you sure?
                </h3>
                <p className="text-gray-600 mt-2">
                  You will be logged out of your account
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-2 px-4 bg-red-500  text-white rounded-md font-medium transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar content */}
      <div
        className={`w-56 bg-white text-gray-700 flex flex-col fixed lg:static z-10 transition-all duration-300 shadow-md ${
          isOpen ? "left-0" : "-left-64 lg:left-0"
        }`}
      >
        {/* Logo/Brand */}
        <div className="p-3 flex items-center gap-2">
          <Link href="/">
            <Image
              src={"/images/logo.png"}
              alt="logo_image"
              width={120}
              height={40}
            />
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 mt-1">
          <Link
            href="/dashboard"
            className={`flex items-center px-4 py-3 rounded-md mx-2 mb-1 transition-colors ${
              isLinkActive("/dashboard")
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/analytics"
            className={`flex items-center px-4 py-3 rounded-md mx-2 mb-1 transition-colors ${
              isLinkActive("/dashboard/analytics")
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-3" />
            <span>Analytics</span>
          </Link>

          <Link
            href="/units"
            className={`flex items-center px-4 py-3 rounded-md mx-2 mb-1 transition-colors ${
              isLinkActive("/dashboard/units")
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Home className="h-5 w-5 mr-3" />
            <span>Units</span>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-gray-200 pt-2 pb-4">
          <button className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md mx-2 mb-1 transition-colors">
            <Moon className="h-5 w-5 mr-3" />
            <span>Dark Mode</span>
          </button>

          <div className="mx-2 border-t border-gray-200 my-2"></div>

          <button
            onClick={initiateLogout}
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md mx-2 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
