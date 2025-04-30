"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/context/translate-api";

const EnumPropertyIntent = ["buy", "rent", "sell", "lease"];

export default function UnitsFilter({ appliedFilters, developers, compounds }) {
  const { t } = useI18n();
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
    value !== "all" ? newParams.set(key, value) : newParams.delete(key);
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Developers Dropdown */}
      <select
        className="px-3 py-2 w-60 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        value={filters.developer_name}
        onChange={(e) => handleFilterChange("developer_name", e.target.value)}
      >
        <option value="all">{t.unitsFilter.allDevelopers}</option>
        {developersSet.map((d, idx) => (
          <option key={idx} value={d}>{d}</option>
        ))}
      </select>

      {/* Compounds Dropdown */}
      <select
        className="w-60 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={filters.project_name}
        onChange={(e) => handleFilterChange("project_name", e.target.value)}
      >
        <option value="all">{t.unitsFilter.allCompounds}</option>
        {compounds.map((c, idx) => (
          <option key={idx} value={c.name}>{c.name}</option>
        ))}
      </select>

      {/* Purpose Dropdown */}
      <select
        className="w-60 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={filters.purpose}
        onChange={(e) => handleFilterChange("purpose", e.target.value)}
      >
        <option value="all">{t.unitsFilter.allPurposes}</option>
        {EnumPropertyIntent.map((purpose) => (
          <option key={purpose} value={purpose}>
            {t.unitsFilter.purposes[purpose]}
          </option>
        ))}
      </select>
    </div>
  );
}