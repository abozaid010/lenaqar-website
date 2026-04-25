"use client";

import { Search, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export default function ReusableSearchInput({
  value,
  onChange,
  placeholder,
  className = "",
  onClear,
  variant = "default", // "default" or "white"
  inputRef,
  onBlur,
  onFocus,
}) {
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";
  const isWhiteVariant = variant === "white";

  const handleClear = () => {
    onChange("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <Search
        size={20}
        className={`absolute ${
          isRTL ? "right-3" : "left-3"
        } top-1/2 transform -translate-y-1/2 ${
          isWhiteVariant ? "text-white/80" : "text-gray-500"
        }`}
      />
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder || t.searchPlaceholder || "Search..."}
        className={`border rounded-md p-2 w-full ${
          isRTL ? "pr-10" : "pl-10"
        } ${value ? (isRTL ? "pl-10" : "pr-10") : ""} focus:outline-none focus:ring-1 ${
          isWhiteVariant
            ? "border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:ring-white/50 focus:border-white/50"
            : "border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
        } text-sm`}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute ${
            isRTL ? "left-4" : "right-4"
          } top-1/2 transform -translate-y-1/2 ${
            isWhiteVariant
              ? "text-white/80 cursor-pointer hover:text-white"
              : "text-gray-600 cursor-pointer hover:text-black"
          }`}
          aria-label={t.unitsSearch?.clearAriaLabel || "Clear search"}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

