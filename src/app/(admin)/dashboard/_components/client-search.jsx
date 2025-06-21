"use client";

import { useI18n } from "@/context/translate-api";
import { debounce } from "@/utils/debounce";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function SearchBar({ q }) {
  const { t } = useI18n();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(q || "");

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
      className="flex items-center space-x-2 mb-2 no-print"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative flex-1">
        <Search
          size={20}
          className="absolute rtl:right-3 ltr:left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.search.placeholder}
          className="border border-gray-300 rounded-md p-2 w-full ltr:pl-10 rtl:pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="absolute top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer hover:text-black rtl:left-4 ltr:right-4"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </form>
  );
}
