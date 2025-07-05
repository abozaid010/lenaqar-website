"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/context/translate-api";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const Header = ({ ci }) => {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 text-white transition-all duration-300 bg-primary`}
      >
        <div className="container">
          <div className="flex items-center justify-between py-2">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold flex items-center">
              <Image
                src="/images/logo-5.png"
                alt="logo_image"
                width={120}
                height={40}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-x-4">
              {ci && (
                <Link
                  href="/dashboard"
                  className="hover:text-blue-200 transition-colors"
                >
                  {t.header.clientDashboard}
                </Link>
              )}

              <CalendarModal buttonText={t.header.jobOpportunities} />

              <Link
                href="/allProberties"
                className="hover:text-blue-200 transition-colors"
              >
                {t.header.allProperties}
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <LanguageSwitcher />
              {!ci && (
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white px-5 py-1.5 rounded-full hover:shadow-lg hover:opacity-90 transition-all duration-300"
                >
                  {t.header.login}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden text-white" onClick={toggleMenu}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#030250]/95 backdrop-blur-md border-t border-blue-700/30">
            <div className="container mx-auto px-4 py-3">
              <nav className="flex flex-col space-y-3">
                {ci && (
                  <Link
                    href="/dashboard"
                    className="hover:text-blue-200 transition-colors py-2"
                  >
                    {t.header.clientDashboard}
                  </Link>
                )}

                <div>
                  <CalendarModal buttonText={t.header.jobOpportunities} />
                </div>

                <Link
                  href="/allProberties"
                  className="hover:text-blue-200 transition-colors py-2"
                >
                  {t.header.allProperties}
                </Link>
                <div className="flex items-center space-x-3 pt-2">
                  {!ci && (
                    <Link
                      href="/login"
                      className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white px-5 py-1.5 rounded-full hover:shadow-lg hover:opacity-90 transition-all duration-300"
                    >
                      {t.header.login}
                    </Link>
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
