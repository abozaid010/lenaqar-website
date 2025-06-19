"use client";

import AddUnitButton from "@/app/(admin)/units/_components/add-unit-button";
import { useI18n } from "@/context/translate-api";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { formatCityLabel } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const EnumPropertyIntent = ["rent", "sell"];

export default function UnitsFilter({
  appliedFilters,
  developers,
  compounds,
  clientName,
  clientId,
  readonly,
  citiesAndDistricts,
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer || "",
    project_name: appliedFilters.project_name || "",
    purpose: appliedFilters.purpose || "",
    property_type: appliedFilters.property_type || "",
    min_price: appliedFilters.min_price || "",
    max_price: appliedFilters.max_price || "",
    city: appliedFilters.city || "",
  }));
  const formattedDataCitiesAndDistricts = !readonly
    ? Object.entries(citiesAndDistricts)
        .filter(([governorate]) => governorate !== "cities")
        .map(([governorate, districts]) => ({
          governorate,
          districts: districts.map((district) => ({
            district,
          })),
        }))
    : [];

  const cities = citiesAndDistricts?.cities;

  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isDeveloperDropdownOpen, setIsDeveloperDropdownOpen] = useState(false);
  const [isPropertyTypeDropdownOpen, setIsPropertyTypeDropdownOpen] =
    useState(false);
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [tempMinPrice, setTempMinPrice] = useState(filters.min_price || "");
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.max_price || "");

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

  // Format price input with commas as user types
  const formatPriceInput = (value) => {
    if (!value) return "";
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, "");
    // Format with commas
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getPriceDisplayText = () => {
    if (filters.min_price || filters.max_price) {
      const min = filters.min_price ? formatPriceInput(filters.min_price) : "0";
      const max = filters.max_price
        ? formatPriceInput(filters.max_price)
        : "5,000,000,000";
      return `${min} - ${max} EGP`;
    }
    return t.unitsFilter.price;
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
      city: "",
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

    // Special handling for price range
    if (key === "min_price" || key === "max_price") {
      newParams.delete("min_price");
      newParams.delete("max_price");
    } else {
      newParams.delete(key);
    }

    router.push(`${window.location.pathname}?${newParams.toString()}`);
  };

  // Check if any filters are applied
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  // Get display name for a filter value
  const getFilterDisplayName = (key, value) => {
    if (!value) return null;

    switch (key) {
      case "developer_name":
        return getTranslatedDeveloperName(value);
      case "project_name":
        return value;
      case "purpose":
        return t.unitsFilter.purposes[value] || value;
      case "property_type":
        const propertyType = buildingTypes.find((type) => type.value === value);
        return propertyType ? propertyType.label : value;
      case "city":
        return t.unitsFilter.cities?.[value] || value;
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
      const min = filters.min_price ? formatPriceInput(filters.min_price) : "0";
      const max = filters.max_price
        ? formatPriceInput(filters.max_price)
        : "5,000,000,000";
      activeFilters.push({
        key: "price_range",
        value: `${min} - ${max} EGP`,
        removeKeys: ["min_price", "max_price"],
      });
    }

    return activeFilters;
  };

  const getSelectedPropertyType = () => {
    if (!filters.property_type || filters.property_type === "all") {
      return t.unitsFilter.allPropertyTypes || "All Property Types";
    }
    const type = buildingTypes.find((t) => t.value === filters.property_type);
    return type
      ? type.label
      : t.unitsFilter.allPropertyTypes || "All Property Types";
  };

  const getSelectedPurpose = () => {
    if (!filters.purpose || filters.purpose === "all") {
      return t.unitsFilter.allPurposes || "All Purposes";
    }
    return t.unitsFilter.purposes[filters.purpose] || filters.purpose;
  };

  const getSelectedDeveloper = () => {
    if (!filters.developer_name || filters.developer_name === "all") {
      return t.unitsFilter.allDevelopers || "All Developers";
    }
    return t.developerNames?.[filters.developer_name] || filters.developer_name;
  };

  const getSelectedProject = () => {
    if (!filters.project_name || filters.project_name === "all") {
      return t.unitsFilter.allCompounds || "All Projects";
    }
    return getTranslatedCompoundName(filters.project_name);
  };

  const getSelectedCity = () => {
    if (!filters.city || filters.city === "all") {
      return t.unitsFilter.allCities || "All Cities";
    }
    return t.unitsFilter.cities?.[filters.city] || filters.city;
  };

  const getTranslatedDeveloperName = (name) => {
    return t.developerNames?.[name] || name;
  };

  // Function to get translated compound name (if available)
  const getTranslatedCompoundName = (name) => {
    // Assuming there might be a translation key for compound names, similar to developer names.
    // If not, it will just return the original name.
    return t.compoundNames?.[name] || name;
  };

  return (
    <div className=" ">
      <div className="flex items-center flex-wrap md:flex-nowrap md:gap-3 gap-2 md:justify-between">
        {/* Cities Dropdown */}
        {!readonly && (
          <div
            className="relative w-full md:w-auto md:flex-1 min-w-0"
            ref={cityDropdownRef}
          >
            <button
              type="button"
              className="w-full px-[16px] py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            >
              <span className="truncate">{getSelectedCity()}</span>
              <svg
                className={`w-[24px] h-[24px] text-[#000000] ml-1 flex-shrink-0 transition-transform ${isCityDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            {isCityDropdownOpen && !readonly && (
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
                {[...cities]
                  .sort((a, b) =>
                    formatCityLabel(a, locale).localeCompare(
                      formatCityLabel(b, locale)
                    )
                  )
                  .map((city, idx) => (
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
        )}

        {/* Developers Dropdown */}
        <div
          className="relative w-full md:w-auto md:flex-1 min-w-0"
          ref={developerDropdownRef}
        >
          <button
            type="button"
            className="w-full px-[16px] py-[10px] h-[40px]  bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsDeveloperDropdownOpen(!isDeveloperDropdownOpen)}
          >
            <span className="truncate">{getSelectedDeveloper()}</span>
            <svg
              className={`w-[24px] h-[24px]  text-[#000000] ml-1 flex-shrink-0 transition-transform ${isDeveloperDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
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
              {[...developersSet].map((d, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer truncate"
                  onClick={() => {
                    handleFilterChange("developer_name", d);
                    setIsDeveloperDropdownOpen(false);
                  }}
                >
                  {getTranslatedDeveloperName(d)}
                </div>
              ))}
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
            className="w-full px-[16px] py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          >
            <span className="truncate">{getSelectedProject()}</span>
            <svg
              className={`w-[24px] h-[24px] text-[#000000] ml-1 flex-shrink-0 transition-transform ${isProjectDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
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
              {[...compounds].map((c, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer truncate"
                  onClick={() => {
                    handleFilterChange("project_name", c.name);
                    setIsProjectDropdownOpen(false);
                  }}
                >
                  {getTranslatedCompoundName(c.name)}
                </div>
              ))}
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
            className="w-full px-[16px] py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsPurposeDropdownOpen(!isPurposeDropdownOpen)}
          >
            <span className="truncate">{getSelectedPurpose()}</span>
            <svg
              className={`w-[24px] h-[24px] text-[#000000]  ml-1 flex-shrink-0 transition-transform ${isPurposeDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
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
            className="w-full px-[16px] py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() =>
              setIsPropertyTypeDropdownOpen(!isPropertyTypeDropdownOpen)
            }
          >
            <span className="truncate">{getSelectedPropertyType()}</span>
            <svg
              className={`w-[24px] h-[24px] text-[#000000]  ml-1 flex-shrink-0 transition-transform ${isPropertyTypeDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
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
              {[...buildingTypes]
                .sort((a, b) => a.label.localeCompare(b.label, "ar"))
                .map((type) => (
                  <div
                    key={type.value}
                    className="px-4 py-3 hover:bg-gray-100 text-[#494A4B] cursor-pointer"
                    onClick={() => {
                      handleFilterChange("property_type", type.value);
                      setIsPropertyTypeDropdownOpen(false);
                    }}
                  >
                    {type.label}
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
            className="w-full px-[16px] py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
            onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
          >
            <span className="truncate">{getPriceDisplayText()}</span>
            <svg
              className={`w-[24px] h-[24px] ml-1  text-[#000000] flex-shrink-0 transition-transform ${isPriceDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
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
                    value={formatPriceInput(tempMinPrice)}
                    onChange={(e) => {
                      // Remove commas and non-digits, then update state
                      const value = e.target.value.replace(/\D/g, "");
                      setTempMinPrice(value);
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
                    value={formatPriceInput(tempMaxPrice)}
                    onChange={(e) => {
                      // Remove commas and non-digits, then update state
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
                  {t.unitsFilter.applay}
                </button>
              </div>
            </div>
          )}
        </div>

        {!readonly && (
          <div className="w-full md:w-auto flex-shrink-0">
            <AddUnitButton
              clientId={clientId}
              clientName={clientName}
              compounds={compounds}
              developers={developersSet}
              citiesAndDistricts={formattedDataCitiesAndDistricts}
              className="w-full md:w-auto text-sm bg-primary text-white rounded-[5px] hover:bg-primary-dark transition-colors"
            />
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2   p-4">
          <span className="text-sm text-gray-600">
            {t.unitsFilter.activeFilter}
          </span>
          <div className="flex flex-wrap gap-2">
            {getActiveFilters().map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-sm text-gray-700"
              >
                <p className="truncate max-w-[150px]">{filter.value}</p>
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
                  <svg
                    className="w-3.5 h-3.5"
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
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            onClick={handleRemoveAllFilters}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
            {t.unitsFilter.clearall}
          </button>
        </div>
      )}
    </div>
  );
}
