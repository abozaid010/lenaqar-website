"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useI18n } from "@/context/translate-api";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import AddUnitButton from "@/app/(admin)/units/_components/add-unit-button";

const EnumPropertyIntent = ["rent", "sell"];

export default function UnitsFilter({ appliedFilters, developers, compounds ,clientName,clientId }) {
  const { t } = useI18n();
  const router = useRouter();
  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer || "",
    project_name: appliedFilters.project_name || "",
    purpose: appliedFilters.purpose || "",
    property_type: appliedFilters.property_type || "",
    min_price: appliedFilters.min_price || "",
    max_price: appliedFilters.max_price || "",
  }));

  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [tempMinPrice, setTempMinPrice] = useState(filters.min_price || "");
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.max_price || "");
  const priceDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useOnClickOutside(priceDropdownRef, () => setIsPriceDropdownOpen(false));

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

  const developersSet = Array.from(
    new Set(developers.map((developer) => developer.name))
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    const newParams = new URLSearchParams(window.location.search);
    value !== "all" ? newParams.set(key, value) : newParams.delete(key);
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  const handlePriceApply = () => {
    // Update filters state
    setFilters((prev) => ({
      ...prev,
      min_price: tempMinPrice || "0", // Set default to "0" if empty
      max_price: tempMaxPrice,
    }));

    // Update URL params
    const newParams = new URLSearchParams(window.location.search);

    // Always set min_price to at least 0
    newParams.set("min_price", tempMinPrice || "0");

    if (tempMaxPrice) {
      newParams.set("max_price", tempMaxPrice);
    } else {
      newParams.set("max_price", "5000000000"); // Default max price
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);
    setIsPriceDropdownOpen(false);
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getPriceDisplayText = () => {
    if (filters.min_price || filters.max_price) {
      const min = filters.min_price ? formatPrice(filters.min_price) : "0";
      const max = filters.max_price
        ? formatPrice(filters.max_price)
        : "5,000,000,000";
      return `${min} - ${max} EGP`;
    }
    return "Price";
  };

  // Function to remove all filters
  const handleRemoveAllFilters = () => {
    setFilters({
      developer_name: "",
      project_name: "",
      purpose: "",
      property_type: "",
      min_price: "",
      max_price: "",
    });

    // Reset temporary price values
    setTempMinPrice("");
    setTempMaxPrice("");

    // Clear URL parameters
    router.push(window.location.pathname);
  };

  // Function to remove a specific filter
  const handleRemoveFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));

    const newParams = new URLSearchParams(window.location.search);
    newParams.delete(key);
    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  // Check if any filters are applied
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  // Get display name for a filter value
  const getFilterDisplayName = (key, value) => {
    if (!value) return null;

    switch (key) {
      case "developer_name":
        return value;
      case "project_name":
        return value;
      case "purpose":
        return t.unitsFilter.purposes[value] || value;
      case "property_type":
        const propertyType = buildingTypes.find((type) => type.value === value);
        return propertyType ? propertyType.label : value;
      case "min_price":
      case "max_price":
        // We'll handle price range as a special case
        return null;
      default:
        return value;
    }
  };

  // Get active filters for display
  const getActiveFilters = () => {
    const activeFilters = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "min_price" && key !== "max_price") {
        const displayName = getFilterDisplayName(key, value);
        if (displayName) {
          activeFilters.push({ key, value: displayName });
        }
      }
    });

    // Add price range as a single filter if either min or max is set
    if (filters.min_price || filters.max_price) {
      const min = filters.min_price ? formatPrice(filters.min_price) : "0";
      const max = filters.max_price
        ? formatPrice(filters.max_price)
        : "5,000,000,000";
      activeFilters.push({
        key: "price_range",
        value: `${min} - ${max} EGP`,
        removeKeys: ["min_price", "max_price"],
      });
    }

    return activeFilters;
  };

  return (
    <div className="w-full mx-auto ">
      <div className="flex items-center pl-3  flex-wrap md:flex-nowrap gap-2 ">
        {/* Developers Dropdown */}
        <select
          className="px-2 py-1.5 w-full sm:w-48 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
          value={filters.developer_name}
          onChange={(e) => handleFilterChange("developer_name", e.target.value)}
        >
          <option value="all">{t.unitsFilter.allDevelopers}</option>
          {developersSet.map((d, idx) => (
            <option key={idx} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Compounds Dropdown */}
        <select
          className="w-full sm:w-48 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
          value={filters.project_name}
          onChange={(e) => handleFilterChange("project_name", e.target.value)}
        >
          <option value="all">{t.unitsFilter.allCompounds}</option>
          {compounds.map((c, idx) => (
            <option key={idx} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Purpose Dropdown */}
        <select
          className="w-full sm:w-48 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
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

        {/* Property Type Dropdown */}
        <select
          className="w-full sm:w-48 px-2 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
          value={filters.property_type}
          onChange={(e) => handleFilterChange("property_type", e.target.value)}
        >
          <option value="all">
            {t.unitsFilter.allPropertyTypes || "All Property Types"}
          </option>
          {buildingTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Price Filter Dropdown */}
        <div className="relative" ref={priceDropdownRef}>
          <button
            type="button"
            className="w-full sm:w-48 px-2 py-1.5 text-sm text-left rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary bg-white flex justify-between items-center"
            onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
          >
            <span>{getPriceDisplayText()}</span>
            <svg
              className={`w-3 h-3 transition-transform ${isPriceDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {isPriceDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg p-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Price EGP
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 text-sm border rounded-md"
                    value={tempMinPrice}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, "");
                      setTempMinPrice(value);
                    }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Price EGP
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 text-sm border rounded-md"
                    value={tempMaxPrice}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, "");
                      setTempMaxPrice(value);
                    }}
                    placeholder="5,000,000,000"
                  />
                </div>

                <button
                  type="button"
                  className="w-full py-1.5 text-sm bg-primary text-white rounded-md"
                  onClick={handlePriceApply}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="">
          <AddUnitButton
            clientId={clientId}
            clientName={clientName}
            compounds={compounds}
            developers={developersSet}
            className=" py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs font-medium text-gray-700">
            Active Filters:
          </span>

          {getActiveFilters().map((filter, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-100 rounded-full px-2 py-0.5 text-xs"
            >
              <span>{filter.value}</span>
              <button
                type="button"
                className="ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (filter.removeKeys) {
                    // For compound filters like price range
                    filter.removeKeys.forEach((key) => handleRemoveFilter(key));
                  } else {
                    handleRemoveFilter(filter.key);
                  }
                }}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            className="ml-1 text-primary hover:text-primary-dark text-xs font-medium"
            onClick={handleRemoveAllFilters}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
