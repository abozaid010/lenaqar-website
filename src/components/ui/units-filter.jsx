"use client";

import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import { useI18n } from "@/context/translate-api";
import { BUILDING_TYPES, STATIC_CITIES } from "@/data/constants";
import { useCompounds, useDevelopers } from "@/hooks/use-admin-shared-data";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { formatCityLabel } from "@/utils/formatters";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "./loading-spinner";
const EnumPropertyIntent = ["rent", "sell"];

export default function UnitsFilter({ appliedFilters, isPublic }) {
  const { data: projectsData, isLoading: projectsLoading } = useCompounds(
    null,
    isPublic
  );
  const { data: developersData, isLoading: developersLoading } = useDevelopers(
    null,
    isPublic
  );
  const [compounds, setCompounds] = useState(projectsData || []);
  const [developers, setDevelopers] = useState(developersData || []);

  const { t, locale } = useI18n();
  const router = useRouter();

  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer_name || "",
    project_name: appliedFilters.project_name || "",
    purpose: appliedFilters.purpose || "",
    property_type: appliedFilters.property_type || "",
    min_price: appliedFilters.min_price || "",
    max_price: appliedFilters.max_price || "",
    city: appliedFilters.city || "",
  }));

  useEffect(() => {
    if (!projectsLoading) {
      setCompounds(projectsData || []);
    }

    if (!developersLoading) {
      setDevelopers(developersData || []);
    }
  }, [developersLoading || projectsLoading]);

  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isDeveloperDropdownOpen, setIsDeveloperDropdownOpen] = useState(false);
  const [isPropertyTypeDropdownOpen, setIsPropertyTypeDropdownOpen] =
    useState(false);
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(() => {
    const initialFilters = [];
    if (filters.developer_name) {
      initialFilters.push({
        key: "developer_name",
        value: getSelectedDeveloper(),
      });
    }
    if (filters.project_name) {
      initialFilters.push({
        key: "project_name",
        value: getSelectedProjectName(),
      });
    }
    if (filters.purpose) {
      initialFilters.push({ key: "purpose", value: filters.purpose });
    }
    if (filters.property_type) {
      initialFilters.push({
        key: "property_type",
        value: filters.property_type,
      });
    }
    if (filters.min_price || filters.max_price) {
      initialFilters.push({
        key: "price_range",
        value: getPriceDisplayText(),
      });
    }
    if (filters.city) {
      initialFilters.push({ key: "city", value: getSelectedCity() });
    }
    return initialFilters;
  });

  const priceDropdownRef = useRef(null);
  const developerDropdownRef = useRef(null);
  const propertyTypeDropdownRef = useRef(null);
  const purposeDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useOnClickOutside(priceDropdownRef, () => setIsPriceDropdownOpen(false));
  useOnClickOutside(developerDropdownRef, () =>
    setIsDeveloperDropdownOpen(false)
  );
  useOnClickOutside(propertyTypeDropdownRef, () =>
    setIsPropertyTypeDropdownOpen(false)
  );
  useOnClickOutside(purposeDropdownRef, () => setIsPurposeDropdownOpen(false));
  useOnClickOutside(projectDropdownRef, () => setIsProjectDropdownOpen(false));
  useOnClickOutside(cityDropdownRef, () => setIsCityDropdownOpen(false));

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);

    // Update URL parameters
    const newParams = new URLSearchParams(window.location.search);

    if (value && value !== "" && value !== "all") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);

    setActiveFilters((prev) => {
      const existingFilterIndex = prev.findIndex((f) => f.key === key);
      if (existingFilterIndex > -1) {
        // Update existing filter
        const updatedFilter = { ...prev[existingFilterIndex], value };
        return [
          ...prev.slice(0, existingFilterIndex),
          updatedFilter,
          ...prev.slice(existingFilterIndex + 1),
        ];
      } else {
        // Add new filter
        return [...prev, { key, value }];
      }
    });
  };

  const handlePriceApply = () => {
    // Update filters state
    const newMinPrice = filters.min_price;
    const newMaxPrice = filters.max_price;

    // Update URL params
    const newParams = new URLSearchParams(window.location.search);

    if (newMinPrice) {
      newParams.set("min_price", newMinPrice);
    } else {
      newParams.delete("min_price");
    }

    if (newMaxPrice) {
      newParams.set("max_price", newMaxPrice);
    } else {
      newParams.delete("max_price");
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);
    setIsPriceDropdownOpen(false);

    setActiveFilters((prev) => {
      const existingFilterIndex = prev.findIndex(
        (f) => f.key === "price_range"
      );
      const priceText = getPriceDisplayText();

      if (existingFilterIndex > -1) {
        // Update existing price filter
        const updatedFilter = { key: "price_range", value: priceText };
        return [
          ...prev.slice(0, existingFilterIndex),
          updatedFilter,
          ...prev.slice(existingFilterIndex + 1),
        ];
      } else {
        // Add new price filter
        return [...prev, { key: "price_range", value: priceText }];
      }
    });
  };

  // Format price input with commas as user types
  function formatPriceInput(value) {
    if (!value) return "";
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, "");
    // Format with commas
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function getPriceDisplayText() {
    if (filters.min_price || filters.max_price) {
      const min = filters.min_price ? formatPriceInput(filters.min_price) : "";
      const max = filters.max_price ? formatPriceInput(filters.max_price) : "";

      if (min && max) {
        return `${min} - ${max} EGP`;
      } else if (min) {
        return `${t.unitsFilter.from || "From"} ${min} EGP`;
      } else if (max) {
        return `${t.unitsFilter.upTo || "Up to"} ${max} EGP`;
      }
    }
    return t.unitsFilter.price;
  }

  // Function to remove all filters
  const handleRemoveAllFilters = () => {
    setFilters({
      developer_name: "",
      project_name: "",
      purpose: "",
      property_type: "",
      min_price: "",
      max_price: "",
      city: "",
    });

    router.push(window.location.pathname);

    setActiveFilters([]);
  };

  // Function to remove a specific filter
  const handleRemoveFilter = (key) => {
    const newParams = new URLSearchParams(window.location.search);

    // Special handling for price range
    if (key === "price_range") {
      newParams.delete("min_price");
      newParams.delete("max_price");
      setFilters((prev) => ({
        ...prev,
        min_price: "",
        max_price: "",
      }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: "" }));
      newParams.delete(key);
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);

    setActiveFilters((prev) =>
      prev.filter((f) => f.key !== key && f.removeKeys?.indexOf(key) === -1)
    );
  };

  function getSelectedPropertyType() {
    if (!filters.property_type || filters.property_type === "all") {
      return t.unitsFilter.allPropertyTypes || "All Property Types";
    }
    const type = BUILDING_TYPES.find((t) => t.value === filters.property_type);
    return locale === "ar"
      ? type.ar_label
      : type.en_label || filters.property_type;
  }

  function getSelectedProjectName() {
    if (!filters.project_name || filters.project_name === "all") {
      return t.unitsFilter.allCompounds || "All Projects";
    }
    const c = compounds.find((c) => c.en_name === filters.project_name);
    return locale === "ar" ? c.ar_name : c.en_name || filters.project_name;
  }

  function getSelectedPurpose() {
    if (!filters.purpose || filters.purpose === "all") {
      return t.unitsFilter.allPurposes || "All Purposes";
    }
    return t.unitsFilter.purposes[filters.purpose] || filters.purpose;
  }

  function getSelectedDeveloper() {
    if (!filters.developer_name || filters.developer_name === "all") {
      return t.unitsFilter.allDevelopers || "All Developers";
    }
    const d = developers.find((d) => d.name === filters.developer_name);

    return locale === "ar" ? d.ar_name : d.en_name || filters.developer_name;
  }

  function getSelectedCity() {
    if (!filters.city || filters.city === "all") {
      return t.unitsFilter.allCities || "All Cities";
    }
    return formatCityLabel(filters.city, locale) || filters.city;
  }

  function getFilterDisplayText(key, value) {
    switch (key) {
      case "developer_name":
        return getSelectedDeveloper();
      case "project_name":
        return getSelectedProjectName();
      case "purpose":
        return getSelectedPurpose();
      case "property_type":
        return getSelectedPropertyType();
      case "city":
        return getSelectedCity();
      case "price_range":
        return getPriceDisplayText();
      default:
        return value;
    }
  }

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
        {/* Cities Dropdown */}
        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={cityDropdownRef}
        >
          <button
            type="button"
            className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
          >
            <span className="truncate">{getSelectedCity()}</span>
            <ChevronDown size={22} className="inline-block mt-1" />
          </button>

          {isCityDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full md:min-w-[200px] bg-white rounded-[5px] shadow-lg py-1 max-h-72 overflow-y-auto">
              <div
                className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                onClick={() => {
                  handleFilterChange("city", "all");
                  setIsCityDropdownOpen(false);
                }}
              >
                {t.unitsFilter.allCities || "All Cities"}
              </div>
              {STATIC_CITIES.sort((a, b) =>
                formatCityLabel(a, locale).localeCompare(
                  formatCityLabel(b, locale)
                )
              ).map((city, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer truncate"
                  onClick={() => {
                    handleFilterChange("city", city);
                    setIsCityDropdownOpen(false);
                  }}
                >
                  {formatCityLabel(city, locale)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Developer Dropdown */}

        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={developerDropdownRef}
        >
          <button
            type="button"
            className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsDeveloperDropdownOpen(!isDeveloperDropdownOpen)}
          >
            <span className="truncate">{getSelectedDeveloper()}</span>
            <ChevronDown size={22} className="inline-block mt-1 shrink-0" />
          </button>

          {isDeveloperDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full md:min-w-[200px] bg-white rounded-[5px] shadow-lg py-1 max-h-72 overflow-y-auto">
              <div
                className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                onClick={() => {
                  handleFilterChange("developer_name", "all");
                  setIsDeveloperDropdownOpen(false);
                }}
              >
                {t.unitsFilter.allDevelopers}
              </div>
              {developersLoading ? (
                <LoadingSpinner
                  size={22}
                  containerClassName="flex items-center justify-center"
                />
              ) : (
                developers
                  .sort((a, b) => {
                    const nameA = locale === "ar" ? a.ar_name : a.en_name;
                    const nameB = locale === "ar" ? b.ar_name : b.en_name;
                    return nameA.trim().localeCompare(nameB.trim(), locale, {
                      sensitivity: "base",
                    });
                  })
                  .map((d, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer truncate"
                      onClick={() => {
                        handleFilterChange("developer_name", d.name);
                        setIsDeveloperDropdownOpen(false);
                      }}
                    >
                      {locale === "ar" ? d.ar_name : d.en_name}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Compounds Dropdown */}

        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={projectDropdownRef}
        >
          <button
            type="button"
            className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          >
            <span className="truncate">{getSelectedProjectName()}</span>
            <ChevronDown size={22} className="inline-block mt-1 shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute z-49 mt-1 w-full md:min-w-[200px] bg-white rounded-[5px] shadow-lg py-1 max-h-72 overflow-y-auto">
              <div
                className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                onClick={() => {
                  handleFilterChange("project_name", "all");
                  setIsProjectDropdownOpen(false);
                }}
              >
                {t.unitsFilter.allCompounds}
              </div>

              {projectsLoading ? (
                <LoadingSpinner
                  size={22}
                  containerClassName="flex items-center justify-center"
                />
              ) : (
                compounds
                  .sort((a, b) => {
                    const nameA = locale === "ar" ? a.ar_name : a.en_name;
                    const nameB = locale === "ar" ? b.ar_name : b.en_name;
                    return nameA.trim().localeCompare(nameB.trim(), locale, {
                      sensitivity: "base",
                    });
                  })
                  .map((c, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer truncate"
                      onClick={() => {
                        handleFilterChange("project_name", c.en_name);
                        setIsProjectDropdownOpen(false);
                      }}
                    >
                      {locale === "ar" ? c.ar_name : c.en_name}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Purpose Dropdown */}
        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={purposeDropdownRef}
        >
          <button
            type="button"
            className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsPurposeDropdownOpen(!isPurposeDropdownOpen)}
          >
            <span className="truncate">{getSelectedPurpose()}</span>
            <ChevronDown size={22} className="inline-block mt-1 shrink-0" />
          </button>

          {isPurposeDropdownOpen && (
            <div className="absolute z-48 mt-1 w-full md:min-w-[200px] bg-white rounded-[5px] shadow-lg py-1 max-h-56 overflow-y-auto">
              <div
                className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                onClick={() => {
                  handleFilterChange("purpose", "all");
                  setIsPurposeDropdownOpen(false);
                }}
              >
                {t.unitsFilter.allPurposes}
              </div>
              {EnumPropertyIntent.map((purpose) => (
                <div
                  key={purpose}
                  className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                  onClick={() => {
                    handleFilterChange("purpose", purpose);
                    setIsPurposeDropdownOpen(false);
                  }}
                >
                  {t.unitsFilter.purposes[purpose]}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property Type Dropdown */}
        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={propertyTypeDropdownRef}
        >
          <button
            type="button"
            className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() =>
              setIsPropertyTypeDropdownOpen(!isPropertyTypeDropdownOpen)
            }
          >
            <span className="truncate">{getSelectedPropertyType()}</span>
            <ChevronDown size={22} className="inline-block mt-1 shrink-0" />
          </button>

          {isPropertyTypeDropdownOpen && (
            <div className="absolute z-47 mt-1 w-full md:min-w-[200px] bg-[#FFFFFF] rounded-[5px] shadow-2xl py-1 max-h-72 overflow-y-auto">
              <div
                className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                onClick={() => {
                  handleFilterChange("property_type", "all");
                  setIsPropertyTypeDropdownOpen(false);
                }}
              >
                {t.unitsFilter.allPropertyTypes}
              </div>
              {BUILDING_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                  onClick={() => {
                    handleFilterChange("property_type", type.value);
                    setIsPropertyTypeDropdownOpen(false);
                  }}
                >
                  {locale === "ar" ? type.ar_label : type.en_label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Filter Dropdown */}
        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={priceDropdownRef}
        >
          <button
            type="button"
            className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
          >
            <span className="truncate">{getPriceDisplayText()}</span>
            <ChevronDown size={22} className="inline-block mt-0.5 shrink-0" />
          </button>

          {isPriceDropdownOpen && (
            <div className="absolute z-46 mt-1 w-full md:min-w-[200px] bg-white rounded-[5px] shadow-2xl p-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t.unitsFilter.min} EGP
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 text-sm border rounded-md"
                    value={formatPriceInput(filters.min_price)}
                    onChange={(e) => {
                      // Remove commas and non-digits, then update state
                      const value = e.target.value.replace(/\D/g, "");
                      setFilters((prev) => ({
                        ...prev,
                        min_price: value,
                      }));
                    }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t.unitsFilter.max} EGP
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 text-sm border rounded-md"
                    value={formatPriceInput(filters.max_price)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFilters((prev) => ({
                        ...prev,
                        max_price: value,
                      }));
                    }}
                    placeholder="5,000,000,000"
                  />
                </div>

                <button
                  type="button"
                  className="w-full py-1.5 text-sm bg-primary text-white rounded-md"
                  onClick={handlePriceApply}
                >
                  {t.unitsFilter.applay}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isPublic && (
          <div className="w-full md:w-auto flex-shrink-0">
            <AddUnitButton className="w-full md:w-auto text-sm bg-primary text-white rounded-[5px] hover:bg-primary-dark transition-colors" />
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">
            {t.unitsFilter.activeFilter}
          </span>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-100 rounded px-1.5 py-1 text-sm text-gray-700"
              >
                <p className="truncate max-w-[180px] text-xs">
                  {getFilterDisplayText(filter.key, filter.value)}
                </p>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    if (filter.removeKeys) {
                      filter.removeKeys.forEach((key) =>
                        handleRemoveFilter(key)
                      );
                    } else {
                      handleRemoveFilter(filter.key);
                    }
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            onClick={handleRemoveAllFilters}
          >
            <Trash2 size={16} />
            {t.unitsFilter.clearall}
          </button>
        </div>
      )}
    </div>
  );
}
