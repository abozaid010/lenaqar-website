"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import AddUnitModal from "./add-new-unit";

export default function UnitsFilter({ appliedFilters, developers, compounds }) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState(() => ({
    developer: appliedFilters.developer || "",
    compound: appliedFilters.compound || "",
    purpose: appliedFilters.purpose || "",
  }));

  const developersSet = Array.from(
    new Set(developers.map((developer) => developer.name))
  );

  const handleSaveUnit = (formData) => {
    console.log("New unit data:", formData);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    const newParams = new URLSearchParams(window.location.search);
    newParams.set(key, value);
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  return (
    <>
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 w-60 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={filters.developer}
            onChange={(e) => handleFilterChange("developer", e.target.value)}
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
            value={filters.compound}
            onChange={(e) => handleFilterChange("compound", e.target.value)}
          >
            <option value="all">All Compounds</option>
            {compounds.map((c, idx) => (
              <option key={idx} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* <select
        className="w-60 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={filters.purpose}
        onChange={(e) => handleFilterChange("purpose", e.target.value)}
      >
        <option value="all">All Purposes</option>
        {compounds.map((c, idx) => (
          <option key={idx} value={c.name}>
            {c.name}
          </option>
        ))}
      </select> */}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex-shrink-0 w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center transition duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Building
        </button>
      </div>

      {/* Add Unit Modal */}
      <AddUnitModal
        developersData={developers}
        comboundata={compounds}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveUnit}
      />
    </>
  );
}
