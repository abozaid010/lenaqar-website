"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RefreshCcw, Search, SlidersHorizontal, SunMoon, X } from "lucide-react";
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
  filtersOpen,
  onFiltersOpenChange,
  activeFilterCount = 0,
  extraActions,
}: {
  title: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showSearch?: boolean;
  /** Mobile-only filters toggle (lg+ keeps filters panel always visible in the page). */
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  activeFilterCount?: number;
  extraActions?: ReactNode;
}) {
  const { translate, locale } = useI18n();
  const isRTL = String(locale || "").toLowerCase().startsWith("ar");

  const [theme, setTheme] = useState(getInitialTheme);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  const hasSearchValue = Boolean(String(searchValue ?? "").trim());
  const showFiltersToggle = typeof onFiltersOpenChange === "function";

  return (
    <div className="sticky top-0 z-10 -mx-3 px-3 pt-3 pb-3 bg-gradient-to-b from-gray-50 to-gray-50/60 backdrop-blur supports-[backdrop-filter]:bg-gray-50/70">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
            <div className="hidden sm:block text-xs text-gray-500">
              {translate("socialMedia.subtitle")}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showSearch ? (
              <button
                type="button"
                onClick={() => setMobileSearchOpen((open) => !open)}
                className="lg:hidden relative h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-expanded={mobileSearchOpen}
                aria-label={translate("socialMedia.search.open", "Search")}
              >
                {mobileSearchOpen ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : (
                  <Search className="h-4 w-4" aria-hidden />
                )}
                {hasSearchValue && !mobileSearchOpen ? (
                  <span
                    className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            ) : null}

            {showFiltersToggle ? (
              <button
                type="button"
                onClick={() => onFiltersOpenChange?.(!filtersOpen)}
                className={`lg:hidden relative h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  filtersOpen
                    ? "border-primary/40 bg-primary/5"
                    : "border-gray-200"
                }`}
                aria-expanded={Boolean(filtersOpen)}
                aria-label={translate("socialMedia.filters.open", "Filters")}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                {activeFilterCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-semibold">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {extraActions}

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
                className="h-9 w-9 sm:w-auto sm:px-3 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isRefreshing}
                aria-label={translate("common.refresh")}
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline text-sm font-medium">
                  {translate("common.refresh")}
                </span>
              </button>
            ) : null}
          </div>
        </div>

        {showSearch ? (
          <div
            className={`items-center gap-2 ${
              mobileSearchOpen ? "flex" : "hidden"
            } lg:flex`}
          >
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
