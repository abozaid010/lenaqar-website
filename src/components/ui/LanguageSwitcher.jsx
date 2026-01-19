"use client";

import { useI18n } from "@/context/translate-api";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { changeLanguage, locale } = useI18n();

  return (
    <button
      onClick={() => changeLanguage(locale === "en" ? "ar" : "en")}
      className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
      aria-label="Toggle language"
    >
      <Globe size={18} />
      <span className="text-sm font-medium">
        {locale === "en" ? "العربية" : "English"}
      </span>
    </button>
  );
}
