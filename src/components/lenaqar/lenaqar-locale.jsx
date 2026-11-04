"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";

/**
 * Public LenaQar pages are Arabic by default (server HTML is always `ar-EG`,
 * `dir=rtl`). English is only used when the visitor explicitly picks it with
 * the header switch — stored under its own key so a leftover CRM `lang=en`
 * cookie still lands on Arabic.
 */
const PUBLIC_LOCALE_KEY = "lenaqar_locale";

export function readPublicLocale() {
  if (typeof window === "undefined") return "ar";
  try {
    return window.localStorage.getItem(PUBLIC_LOCALE_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function writePublicLocale(lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PUBLIC_LOCALE_KEY, lang === "en" ? "en" : "ar");
  } catch {
    /* private mode: the switch still works for this page view */
  }
}

export default function LenaqarLocale({ children }) {
  const { locale, changeLanguage } = useI18n();

  useEffect(() => {
    const desired = readPublicLocale();
    if (locale !== desired) {
      changeLanguage(desired);
    }
  }, []); // Run once on mount only

  return children;
}
