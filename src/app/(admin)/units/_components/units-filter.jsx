"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EnumPropertyIntent = ["buy", "rent", "sell", "lease"];

export default function UnitsFilter({ appliedFilters, developers, compounds }) {
  const router = useRouter();
  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer || "",
    project_name: appliedFilters.project_name || "",
    purpose: appliedFilters.purpose || "",
  }));

  const developersSet = Array.from(
    new Set(developers.map((developer) => developer.name))
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    const newParams = new URLSearchParams(window.location.search);

    // Only set the parameter if it's not "all"
    if (value !== "all") {
      newParams.set(key, value);
    } else {
      // Remove the parameter if it's "all"
      newParams.delete(key);
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };
  return (
    <>
      <div className="flex items-center gap-2">
        <select
          className="px-3 py-2 w-60 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={filters.developer_name}
          onChange={(e) => handleFilterChange("developer_name", e.target.value)}
        >
          <option value="all">All Developers</option>
          {developersSet.map((d, idx) => (
            <option key={idx} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className="w-60 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.project_name}
          onChange={(e) => handleFilterChange("project_name", e.target.value)}
        >
          <option value="all">All Compounds</option>
          {compounds.map((c, idx) => (
            <option key={idx} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="w-60 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.purpose}
          onChange={(e) => handleFilterChange("purpose", e.target.value)}
        >
          <option value="all">All Purposes</option>
          {EnumPropertyIntent.map((purpose, idx) => (
            <option key={idx} value={purpose}>
              {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
