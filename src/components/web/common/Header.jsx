"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // إضافة استيراد مكون Image
import { Menu, X, Globe, AlertTriangle } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useI18n } from "@/context/translate-api";
import CalendarModal from "@/components/ui/calendar-modal";

const Header = () => {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const ci = Cookies.get("client_id");

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine if scrolled for background color
      // Only add background when scrolled past first section
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Always keep header visible
      setIsVisible(true);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
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
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md font-medium transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-40 text-white transition-all duration-300 ${
          isScrolled
            ? "bg-[#030250] bg-opacity-90 backdrop-blur-md"
            : "bg-transparent"
        } ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold flex items-center">
              <Image
                src="/images/logo-5.svg"
                alt="logo_image"
                width={120}
                height={40}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-x-6">
              <Link href="/" className="hover:text-blue-200 transition-colors">
                {t.header.home}
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-blue-200 transition-colors"
              >
                {t.header.clientDashboard}
              </Link>
              <Link href="" className="hover:text-blue-200 transition-colors">
              <CalendarModal buttonText={t.header.jobOpportunities} />
              </Link>
              <Link href="/allProberties" className="hover:text-blue-200 transition-colors">
                {t.header.allProperties}
               
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              {!ci ? (
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white px-5 py-1.5 rounded-full hover:shadow-lg hover:opacity-90 transition-all duration-300"
                >
                  {t.header.login}
                </Link>
              ) : (
                <button
                  onClick={initiateLogout}
                  className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white px-5 py-1.5 rounded-full hover:shadow-lg hover:opacity-90 transition-all duration-300"
                >
                  {t.header.logOut}
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white" onClick={toggleMenu}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#030250]/95 backdrop-blur-md border-t border-blue-700/30">
            <div className="container mx-auto px-4 py-3">
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/"
                  className="hover:text-blue-200 transition-colors py-2"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="hover:text-blue-200 transition-colors py-2"
                >
                  Client Dashboard
                </Link>
                <Link
                  href=""
                  className="hover:text-blue-200 transition-colors py-2"
                >
                  Job Opportunities
                </Link>
                <Link
                  href=""
                  className="hover:text-blue-200 transition-colors py-2"
                >
                  All Properties
                </Link>
                <div className="flex items-center space-x-3 pt-2">
                  {!ci ? (
                    <>
                      <Link
                        href="/signup"
                        className="text-white border border-[#21EAF4] px-5 py-1.5 rounded-full hover:bg-[#21EAF4]/10 transition-all duration-300"
                      >
                        Sign Up
                      </Link>
                      <Link
                        href="/login"
                        className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white px-5 py-1.5 rounded-full hover:shadow-lg hover:opacity-90 transition-all duration-300"
                      >
                        Sign In
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={initiateLogout}
                      className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white px-5 py-1.5 rounded-full hover:shadow-lg hover:opacity-90 transition-all duration-300"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
