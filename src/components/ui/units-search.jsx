"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { debounce } from "@/utils/debounce";
import { useI18n } from "@/hooks/useI18n";

export default function UnitsSearch({ q }) {
  const { t } = useI18n();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(q || "");
  const isRTL = t.direction === 'rtl';
  const debouncedSearch = useCallback(
    debounce((term) => {
      const params = new URLSearchParams(window.location.search);
      if (term) {
        params.set("query", term);
      } else {
        params.delete("query");
      }
      router.push(`${window.location.pathname}?${params.toString()}`);
    }, 300),
    [router]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleSearchClear = () => {
    setSearchTerm("");
    const params = new URLSearchParams(window.location.search);
    params.delete("query");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <form
      className="flex items-center space-x-2 mb-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative flex-1">
        <Search
          size={20}
          className={`absolute ${isRTL ? "right-3": "left-3"} top-1/2 transform -translate-y-1/2 text-gray-500`}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.unitsSearch.placeholder}
          className="border border-gray-300 rounded-md p-2 px-8 w-full pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleSearchClear}
            className={`absolute ${isRTL ? "left-4": "right-4"} top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer hover:text-black`}
            aria-label={t.unitsSearch.clearAriaLabel}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </form>
  );
}