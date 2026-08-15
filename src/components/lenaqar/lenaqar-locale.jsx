"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";

/** Public LenaQar pages are Arabic. Ignore a leftover CRM `lang=en` cookie. */
export default function LenaqarLocale({ children }) {
  const { locale, changeLanguage } = useI18n();

  useEffect(() => {
    if (locale !== "ar") {
      changeLanguage("ar");
    }
  }, [locale, changeLanguage]);

  return children;
}
