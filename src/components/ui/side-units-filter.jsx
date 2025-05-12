"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useI18n } from "@/context/translate-api";
import FilterCheckboxGroup from "@/components/ui/filter-checkbox-group";
import PriceRangeSlider from "./price-range-slider";

const EnumPropertyIntent = ["rent", "sell"];

export default function SideUnitFilters({
  appliedFilters,
  developers,
  projects,
  minPrice = 0,
  maxPrice = 10000000,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer || "",
    project_name: appliedFilters.project_name || "",
    purpose: appliedFilters.purpose || "",
    property_type: appliedFilters.property_type || "",
    project_name: appliedFilters.project_name || "",
    min_price: appliedFilters.min_price || "",
    max_price: appliedFilters.max_price || "",
  }));

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      developer_name: appliedFilters.developer || "",
      project_name: appliedFilters.project_name || "",
      purpose: appliedFilters.purpose || "",
      property_type: appliedFilters.property_type || "",
      min_price: appliedFilters.min_price || "",
      max_price: appliedFilters.max_price || "",
    }));
  }, [appliedFilters]);

  const buildingTypes = [
    { value: "apartment", label: t.basicDetails.buildingTypes.apartment },
    { value: "villa", label: t.basicDetails.buildingTypes.villa },
    { value: "townhouse", label: t.basicDetails.buildingTypes.townhouse },
    { value: "duplex", label: t.basicDetails.buildingTypes.duplex },
    { value: "penthouse", label: t.basicDetails.buildingTypes.penthouse },
    { value: "studio", label: t.basicDetails.buildingTypes.studio },
    { value: "chalet", label: t.basicDetails.buildingTypes.chalet },
    { value: "office", label: t.basicDetails.buildingTypes.office },
    { value: "shop", label: t.basicDetails.buildingTypes.shop },
    { value: "twinhouse", label: t.basicDetails.buildingTypes.twinhouse },
    { value: "house", label: t.basicDetails.buildingTypes.house },
  ];

  const handleFilterChange = (key, value) => {
    console.log("Filter changed:", key, value);
    setFilters((prev) => ({ ...prev, [key]: value }));

    const newParams = new URLSearchParams(window.location.search);
    if (value === "") {
      newParams.delete(key);
    } else if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const handlePriceChange = (min, max) => {
    setFilters((prev) => ({
      ...prev,
      min_price: min,
      max_price: max,
    }));

    const newParams = new URLSearchParams(window.location.search);
    newParams.set("min_price", min);
    newParams.set("max_price", max);
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const handleReset = () => {
    router.push(`${window.location.pathname}`);
  };

  return (
    <div
      className={`
          fixed md:sticky top-0 md:top-4 w-66 bg-white shadow-lg md:shadow-md rounded-none md:rounded-lg
          transition-transform duration-300 ease-in-out z-10
        `}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
      </div>

      <div className="py-3 pl-3 pr-2">
        <div className="h-[70vh] overflow-y-auto inner-scroll-bar mb-6">
          <div className="mr-2 space-y-4">
            {/* Purpose Filter */}
            <FilterCheckboxGroup
              title="Purpose"
              options={EnumPropertyIntent.map((purpose) => ({
                id: purpose,
                label: purpose,
                value: purpose,
              }))}
              selectedValue={filters.purpose}
              onChange={(value) => handleFilterChange("purpose", value)}
            />

            {/* Property Type Filter */}
            <FilterCheckboxGroup
              title="Property Type"
              options={buildingTypes.map((type) => ({
                id: type.value,
                label: type.label.charAt(0).toUpperCase() + type.label.slice(1),
                value: type.value,
              }))}
              selectedValue={filters.property_type}
              onChange={(value) => handleFilterChange("property_type", value)}
            />

            {/* Developer Filter */}
            <FilterCheckboxGroup
              title="Developer"
              options={developers.map((developer) => ({
                id: developer,
                label: developer,
                value: developer,
              }))}
              selectedValue={filters.developer_name}
              onChange={(value) => handleFilterChange("developer_name", value)}
              searchable={developers.length > 5}
            />

            {/* Project Filter */}
            <FilterCheckboxGroup
              title="Projects"
              options={projects.map((project) => ({
                id: project.name,
                label:
                  project.name.charAt(0).toUpperCase() + project.name.slice(1),
                value: project.name,
              }))}
              selectedValue={filters.project_name}
              onChange={(value) => handleFilterChange("project_name", value)}
              searchable={projects.length > 5}
            />

            {/* Price Range Filter */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Price Range</h3>
              <PriceRangeSlider
                min={minPrice}
                max={maxPrice}
                value={[
                  +filters.min_price || minPrice,
                  +filters.max_price || maxPrice,
                ]}
                onChange={handlePriceChange}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="bg-gray-200 w-full hover:bg-gray-300 text-gray-800 py-1 px-4 rounded-md transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
