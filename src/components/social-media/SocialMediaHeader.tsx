"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, SunMoon } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  return "light";
}

export function SocialMediaHeader({
  title,
  searchValue,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  showSearch = true,
}: {
  title: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showSearch?: boolean;
}) {
  const { translate, locale } = useI18n();
  const isRTL = String(locale || "").toLowerCase().startsWith("ar");

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const searchPlaceholder = useMemo(
    () => translate("socialMedia.search.placeholder"),
    [translate]
  );

  return (
    <div className="sticky top-0 z-10 -mx-3 px-3 pt-3 pb-3 bg-gradient-to-b from-gray-50 to-gray-50/60 backdrop-blur supports-[backdrop-filter]:bg-gray-50/70">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
            <div className="text-xs text-gray-500">
              {translate("socialMedia.subtitle")}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={translate("socialMedia.themeToggle")}
            >
              <SunMoon className="h-4 w-4" />
            </button>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="h-9 px-3 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isRefreshing}
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="text-sm font-medium">
                  {translate("common.refresh")}
                </span>
              </button>
            ) : null}
          </div>
        </div>

        {showSearch ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${
                  isRTL ? "right-3" : "left-3"
                }`}
                aria-hidden
              />
              <input
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className={`h-10 w-full rounded-xl border border-gray-200 bg-white px-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                }`}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

