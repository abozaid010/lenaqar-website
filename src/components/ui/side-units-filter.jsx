"use client";

import FilterCheckboxGroup from "@/components/ui/filter-checkbox-group";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import PriceRangeSlider from "./price-range-slider";

const EnumPropertyIntent = ["rent", "sell"];

export default function SideUnitFilters({
  appliedFilters,
  developers,
  projects,
  minPrice = 0,
  maxPrice = 10000000,
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);
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

  const handleFilterChange = (key, value) => {
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
              options={BUILDING_TYPES.map((type) => ({
                id: type.value,
                label: locale === "ar" ? type.ar_label : type.en_label,
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
