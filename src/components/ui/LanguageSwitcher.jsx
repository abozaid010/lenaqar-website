"use client";

import { useI18n } from "@/hooks/useI18n";
import { Globe, Loader2 } from "lucide-react";
import { useState } from "react";

export function LanguageSwitcher() {
  const { changeLanguage, locale, isLocaleLoading } = useI18n();
  const [isSwitching, setIsSwitching] = useState(false);

  const busy = isLocaleLoading || isSwitching;

  const handleToggle = async () => {
    if (busy) return;
    setIsSwitching(true);
    try {
      await changeLanguage(locale === "en" ? "ar" : "en");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy}
      aria-busy={busy}
      className="flex items-center gap-1 h-10 px-3 rounded-md cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="Toggle language"
    >
      {busy ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
      <span className="text-sm font-medium">
        {locale === "en" ? "العربية" : "English"}
      </span>
    </button>
  );
}
