"use client";

import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import { useI18n } from "@/context/translate-api";
import { getBuildingTypes } from "@/data/constants";
import { useProjectsNames, useDevelopers } from "@/hooks/use-admin-shared-data";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { ChevronDown, FileSpreadsheet, Trash2, X } from "lucide-react";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unitKeys } from "@/utils/query-utils";
import LoadingSpinner from "./loading-spinner";
import UploadUnitsExcelDialog from "./upload-units-excel-dialog";
const EnumPropertyIntent = ["rent", "sell"];

export default function UnitsFilter({ appliedFilters, isPublic }) {
  const { data: projectsData, isLoading: projectsLoading } = useProjectsNames(
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
  const queryClient = useQueryClient();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);


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

  // Load city labels asynchronously
  useEffect(() => {
    const loadCityLabels = async () => {
      try {
        const manager = (await import("@/utils/city_manager")).default.getInstance();
        const cities = await manager.getCities();
        const labels = {};

        for (const city of cities) {
          labels[city.value] = await manager.getCityLabel(city.id, locale);
        }

        setCityLabels(labels);
      } catch (error) {
        console.error("Failed to load city labels:", error);
      }
    };

    loadCityLabels();
  }, [locale]);

  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [cityLabels, setCityLabels] = useState({});
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

  // Close dropdown when clicking outside
  useOnClickOutside(priceDropdownRef, () => setIsPriceDropdownOpen(false));

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

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    
    // Update URL - this will trigger Next.js to re-render with new searchParams
    router.push(newUrl);

    // Force refresh: If project_name changed, invalidate unit queries to force fresh API call
    // This ensures the API is called immediately with the new project filter
    if (key === "project_name") {
      // Invalidate all unit list queries - this causes matching queries to refetch immediately
      // When the component re-renders with new searchParams, the query key changes
      // and the invalidated queries will be refetched to get fresh data
      // Using refetchType: 'active' ensures only currently mounted queries refetch
      queryClient.invalidateQueries({ 
        queryKey: unitKeys.lists(),
        refetchType: 'active' // Only refetch active queries (currently mounted components)
      });
    }

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
    const type = BUILDING_TYPES.find((bt) => bt.value === filters.property_type);
    return type
      ? locale === "ar"
        ? type.ar_label
        : type.en_label
      : filters.property_type;
  }

  function getSelectedProjectName() {
    if (!filters.project_name || filters.project_name === "all") {
      return t.unitsFilter.allCompounds || "All Projects";
    }
    const c = compounds.find((c) => c.en_name === filters.project_name);
    if (!c) return filters.project_name;
    return locale === "ar" ? c.ar_name : c.en_name || filters.project_name;
  }

  function getSelectedPurpose() {
    if (!filters.purpose || filters.purpose === "all") {
      return t.unitsFilter.allPurposes || "All Purposes";
    }
    return t.unitsFilter.purposes[filters.purpose] || filters.purpose;
  }

  const getDeveloperValue = (dev) => {
    if (!dev) return "";
    const v =
      dev.developer_name ??
      dev.en_name ??
      dev.ar_name ??
      dev.name ??
      dev.id ??
      "";
    return String(v);
  };

  const getDeveloperLabel = (dev, locale) => {
    if (!dev) return "";
    if (locale === "ar") {
      return dev.ar_name || dev.developer_name || dev.en_name || dev.name || "";
    }
    return dev.en_name || dev.developer_name || dev.ar_name || dev.name || "";
  };

  function getSelectedDeveloper() {
    if (!filters.developer_name || filters.developer_name === "all") {
      return t.unitsFilter.allDevelopers || "All Developers";
    }
    const d = developers.find((d) => getDeveloperValue(d) === filters.developer_name);
    if (!d) return filters.developer_name;
    return getDeveloperLabel(d, locale) || filters.developer_name;
  }

  function getSelectedCity() {
    if (!filters.city || filters.city === "all" || filters.city === "") {
      return t.unitsFilter.allCities || "All Cities";
    }
    return cityLabels[filters.city] || filters.city;
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
        <div className="w-full md:w-auto md:flex-1 min-w-0">
          <SearchableCitySelect
            value={filters.city === "all" ? "" : filters.city}
            onChange={(e) => {
              const cityValue = e.target.value || "all";
              handleFilterChange("city", cityValue);
            }}
            name="city"
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allCities || "All Cities"}
            placeholder={t.unitsFilter.allCities || "All Cities"}
            className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
          />
        </div>

        {/* Developer Dropdown */}
        <div className="w-full md:w-auto md:flex-1 min-w-0">
          <SearchableDropdownSelect
            options={developers}
            value={filters.developer_name === "all" ? "" : filters.developer_name}
            onChange={(e) => {
              const developerValue = e.target.value || "all";
              handleFilterChange("developer_name", developerValue);
            }}
            name="developer_name"
            getValue={getDeveloperValue}
            getLabel={getDeveloperLabel}
            searchFields={["ar_name", "en_name", "developer_name", "name"]}
            sortOptions={(options, locale) => {
              return [...options].sort((a, b) => {
                const nameA = getDeveloperLabel(a, locale);
                const nameB = getDeveloperLabel(b, locale);
                return (nameA || "").trim().localeCompare((nameB || "").trim(), locale, {
                  sensitivity: "base",
                });
              });
            }}
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allDevelopers || "All Developers"}
            placeholder={t.unitsFilter.allDevelopers || "All Developers"}
            isLoading={developersLoading}
            loadingText={locale === "ar" ? "جاري التحميل..." : "Loading developers..."}
            noResultsText={locale === "ar" ? "لا توجد نتائج" : "No developers found"}
            searchPlaceholder={locale === "ar" ? "ابحث عن المطور..." : "Search developers..."}
            className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
          />
        </div>

        {/* Compounds Dropdown */}
        <div className="w-full md:w-auto md:flex-1 min-w-0">
          <SearchableProjectSelect
            value={filters.project_name === "all" ? "" : filters.project_name}
            onChange={(e) => {
              const projectValue = e.target.value || "all";
              handleFilterChange("project_name", projectValue);
            }}
            name="project_name"
            projects={compounds}
            isPublic={isPublic}
            isLoading={projectsLoading}
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allCompounds || "All Projects"}
            placeholder={t.unitsFilter.allCompounds || "All Projects"}
            className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
          />
        </div>

        {/* Purpose Dropdown */}
        <div className="w-full md:w-auto md:flex-1 min-w-0">
          <SearchableDropdownSelect
            options={EnumPropertyIntent.map((purpose) => ({
              value: purpose,
              label: t.unitsFilter.purposes[purpose],
            }))}
            value={filters.purpose === "all" ? "" : filters.purpose}
            onChange={(e) => {
              const purposeValue = e.target.value || "all";
              handleFilterChange("purpose", purposeValue);
            }}
            name="purpose"
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allPurposes || "All Purposes"}
            placeholder={t.unitsFilter.allPurposes || "All Purposes"}
            searchPlaceholder={locale === "ar" ? "ابحث عن الغرض..." : "Search purposes..."}
            className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
          />
        </div>

        {/* Property Type Dropdown */}
        <div className="w-full md:w-auto md:flex-1 min-w-0">
          <SearchableDropdownSelect
            options={BUILDING_TYPES}
            value={filters.property_type === "all" ? "" : filters.property_type}
            onChange={(e) => {
              const propertyTypeValue = e.target.value || "all";
              handleFilterChange("property_type", propertyTypeValue);
            }}
            name="property_type"
            getValue={(type) => type.value}
            getLabel={(type, locale) => locale === "ar" ? type.ar_label : type.en_label}
            searchFields={["en_label", "ar_label", "value"]}
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allPropertyTypes || "All Property Types"}
            placeholder={t.unitsFilter.allPropertyTypes || "All Property Types"}
            searchPlaceholder={locale === "ar" ? "ابحث عن نوع العقار..." : "Search property types..."}
            className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
          />
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
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="flex-1 md:flex-initial px-[16px] py-[10px] h-[40px] bg-green-600 hover:bg-green-700 text-white rounded-[5px] flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">
                {t.uploadExcel?.button || "Upload Excel"}
              </span>
            </button>
            <AddUnitButton className="flex-1 md:flex-initial text-sm bg-primary text-white rounded-[5px] hover:bg-primary-dark transition-colors" />
            <VideoInstructionsDialog
              variant="units"
              iconSize="lg"
              tooltipText={t.unitsFilter?.instructions || "How to manage units"}
            />
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

      {/* Upload Excel Dialog */}
      <UploadUnitsExcelDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </div>
  );
}
