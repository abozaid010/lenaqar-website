"use client";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl, SOLUTION_ROUTES } from "@/lib/solutions/links";
import { ChevronDown, Download, Menu, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SOLUTION_LINKS = [
  { href: SOLUTION_ROUTES.brokers, labelKey: "solutions.nav.forBrokers" },
  { href: SOLUTION_ROUTES.developers, labelKey: "solutions.nav.forDevelopers" },
  { href: SOLUTION_ROUTES.agencies, labelKey: "solutions.nav.forAgencies" },
];

export default function SolutionsNavbar({ clientId }) {
  const { translate } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navBg = scrolled
    ? "bg-primary/95 backdrop-blur-md shadow-lg"
    : "bg-primary";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 text-white transition-all duration-300 ${navBg}`}
    >
      <div className="container">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/logo-5.png"
              alt="Lena AI"
              width={110}
              height={36}
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
                aria-expanded={solutionsOpen}
                aria-haspopup="true"
              >
                {translate("solutions.nav.solutions")}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${solutionsOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {solutionsOpen ? (
                <div className="absolute top-full mt-2 min-w-[240px] rounded-xl bg-white text-slate-800 shadow-xl border border-slate-100 py-2 start-0">
                  {SOLUTION_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      {translate(link.labelKey)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              {translate("solutions.nav.whatsapp")}
            </a>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              {translate("solutions.nav.contact")}
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden />
              {translate("solutions.nav.downloadApp")}
            </Link>
            <LanguageSwitcher />
            <Link
              href={clientId ? `/${clientId}/dashboard` : "/login"}
              className="rounded-full bg-gradient-to-r from-[#3926A7] to-[#21EAF4] px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {clientId
                ? translate("solutions.nav.dashboard")
                : translate("solutions.nav.login")}
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={
              menuOpen
                ? translate("solutions.nav.menuClose")
                : translate("solutions.nav.menuOpen")
            }
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="lg:hidden border-t border-white/20 bg-primary/98 backdrop-blur-md">
          <nav className="container py-4 flex flex-col gap-1" aria-label="Mobile">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
              {translate("solutions.nav.solutions")}
            </p>
            {SOLUTION_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 rounded-lg hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {translate(link.labelKey)}
              </Link>
            ))}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-3 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] py-2.5 text-white font-medium transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              {translate("solutions.nav.whatsapp")}
            </a>
            <Link
              href="/contact"
              className="px-3 py-2.5 rounded-lg hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              {translate("solutions.nav.contact")}
            </Link>
            <Link
              href="/download"
              className="px-3 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <Download className="h-4 w-4" aria-hidden />
              {translate("solutions.nav.downloadApp")}
            </Link>
            <div className="px-3 pt-2 flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href={clientId ? `/${clientId}/dashboard` : "/login"}
                className="flex-1 text-center rounded-full bg-gradient-to-r from-[#3926A7] to-[#21EAF4] py-2.5 text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {clientId
                  ? translate("solutions.nav.dashboard")
                  : translate("solutions.nav.login")}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
