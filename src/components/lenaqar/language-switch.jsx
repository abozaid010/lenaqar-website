"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { ANALYTICS } from "@/constants/analytics";
import { trackGa } from "@/lib/analytics";
import { writePublicLocale } from "./lenaqar-locale";

/** Arabic ⇄ English toggle for the public header. Arabic is the default. */
export default function LanguageSwitch({ className = "" }) {
  const { locale, changeLanguage, isLocaleLoading } = useI18n();
  const next = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      lang={next === "ar" ? "ar" : "en"}
      onClick={() => {
        trackGa(ANALYTICS.EVENTS.LANGUAGE_SWITCHED, { language: next });
        writePublicLocale(next);
        changeLanguage(next);
      }}
      disabled={isLocaleLoading}
      aria-label={next === "en" ? "Switch to English" : "التبديل للعربية"}
      className={`compact-btn inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/30 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60 ${className}`}
    >
      <Languages aria-hidden="true" className="size-4" />
      <span>{next === "en" ? "EN" : "عربي"}</span>
    </button>
  );
}
