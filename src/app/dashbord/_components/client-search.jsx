"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ q }) {
  const [searchTerm, setSearchTerm] = useState(q || "");

  return (
    <form className="flex items-center space-x-2 mb-2">
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
          className="border border-gray-300 rounded-md p-2 w-full pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 hover:bg-gray-100 text-sm"
        />
      </div>
    </form>
  );
}
