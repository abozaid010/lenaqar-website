"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import AddUnitModal from "./add-new-unit";
import  {EnumPropertyIntent}  from "../../../../components/dashbord/data/propertyEnums.json";

export default function UnitsFilter({ appliedFilters, developers, compounds }) {
  const router = useRouter();
  console.log(appliedFilters)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer || "",
    project_name: appliedFilters.project_name || "",
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
    
    // Only set the parameter if it's not "all"
    if (value !== "all") {
      newParams.set(key, value);
    } else {
      // Remove the parameter if it's "all"
      newParams.delete(key);
    }
    
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };
  console.log(filters)
  return (
    <>
      <div className="flex items-center gap-2 justify-between">
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
