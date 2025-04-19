"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar({ q }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(q || "");

  const onSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    params.set("query", searchTerm);

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    const params = new URLSearchParams(window.location.search);
    params.delete("query");

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <form className="flex items-center space-x-2 mb-2" onSubmit={onSubmit}>
      <div className="relative flex-1">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search client by name or number..."
          className="border border-gray-300 rounded-md p-2 w-full pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 text-sm"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="absolute right-22 top-1/2 transform -translate-y-1/2 text-gray-600 cursor-pointer hover:text-black"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}

        <button
          disabled={!searchTerm}
          className="absolute right-1 top-[9%] h-[82%] flex items-center justify-center cursor-pointer rounded-md bg-blue-500 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-600 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
        >
          search
        </button>
      </div>
    </form>
  );
}
