"use client";

import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useProjectsNames, useDeveloperNames } from "@/hooks/use-admin-shared-data";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { ChevronDown, FileSpreadsheet, Trash2, X } from "lucide-react";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unitKeys } from "@/utils/query-utils";
import LoadingSpinner from "./loading-spinner";
import UploadUnitsExcelDialog from "./upload-units-excel-dialog";
const EnumPropertyIntent = ["rent", "sell"];

export default function UnitsFilter({ appliedFilters, isPublic }) {
  const { data: projectsData, isLoading: projectsLoading } = useProjectsNames(
    isPublic
  );
  const { data: developersData, isLoading: developersLoading } = useDeveloperNames(
    null,
    isPublic
  );
  const [compounds, setCompounds] = useState(projectsData || []);
  const [developers, setDevelopers] = useState(developersData || []);

  const { t, locale, translate } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);


  const [myInventory, setMyInventory] = useState(false);
  const [resale, setResale] = useState(false);

  const [filters, setFilters] = useState(() => ({
    developer_name: appliedFilters.developer_name || "",
    project_name: appliedFilters.project_name || "",
    purpose: appliedFilters.purpose || "",
    property_type: appliedFilters.property_type || "",
    min_price: appliedFilters.min_price || "",
    max_price: appliedFilters.max_price || "",
    city: appliedFilters.city || "",
    my_inventory: false,
    resale: false,
    min_area: appliedFilters.min_area || "",
  }));

  const [priceRangeError, setPriceRangeError] = useState("");

  // Debounced numeric search (price/area) to avoid spamming backend
  const numericDebounceRef = useRef(null);

  // Get client ID from token for My Inventory filter.
  // IMPORTANT: compute on mount only to avoid SSR hydration mismatch.
  const [hasClientId, setHasClientId] = useState(false);
  useEffect(() => {
    setHasClientId(!!getClientIdFromToken());
  }, []);

  const parseNumeric = useCallback((v) => {
    if (v === undefined || v === null) return null;
    const cleaned = String(v).replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }, []);

  useEffect(() => {
    if (!projectsLoading) {
      setCompounds(projectsData || []);
    }

    if (!developersLoading) {
      setDevelopers(developersData || []);
    }
  }, [projectsLoading, projectsData, developersLoading, developersData]);

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

  useEffect(() => {
    return () => {
      if (numericDebounceRef.current) clearTimeout(numericDebounceRef.current);
    };
  }, []);

  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [cityLabels, setCityLabels] = useState({});
  const [activeFilters, setActiveFilters] = useState(() => {
    const initialFilters = [];
    if (filters.my_inventory) {
      initialFilters.push({ key: "my_inventory", value: t.unitsFilter.myInventory });
    }
    if (filters.resale) {
      initialFilters.push({ key: "resale", value: t.unitsFilter.resale });
    }
    if (filters.min_area) {
      initialFilters.push({ key: "min_area", value: `${t.unitsFilter.minArea}: ${filters.min_area} m²` });
    }
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

  const buildActiveFilters = useCallback((nextFilters) => {
    const list = [];
    if (nextFilters.my_inventory) {
      list.push({ key: "my_inventory", value: t.unitsFilter.myInventory });
    }
    if (nextFilters.resale) {
      list.push({ key: "resale", value: t.unitsFilter.resale });
    }
    if (nextFilters.min_area) {
      list.push({
        key: "min_area",
        value: `${t.unitsFilter.minArea}: ${nextFilters.min_area} m²`,
      });
    }
    if (nextFilters.developer_name) {
      list.push({ key: "developer_name", value: getSelectedDeveloper() });
    }
    if (nextFilters.project_name) {
      list.push({ key: "project_name", value: getSelectedProjectName() });
    }
    if (nextFilters.purpose) {
      list.push({ key: "purpose", value: nextFilters.purpose });
    }
    if (nextFilters.property_type) {
      list.push({ key: "property_type", value: nextFilters.property_type });
    }
    if (nextFilters.min_price || nextFilters.max_price) {
      const min = nextFilters.min_price ? formatPriceInput(nextFilters.min_price) : "";
      const max = nextFilters.max_price ? formatPriceInput(nextFilters.max_price) : "";
      let value = t.unitsFilter.price;
      if (min && max) value = `${min} - ${max} EGP`;
      else if (min) value = `${t.unitsFilter.from || "From"} ${min} EGP`;
      else if (max) value = `${t.unitsFilter.upTo || "Up to"} ${max} EGP`;
      list.push({ key: "price_range", value });
    }
    if (nextFilters.city) {
      list.push({ key: "city", value: getSelectedCity() });
    }
    return list;
  }, [locale, t, compounds, developers, cityLabels]);

  const applyNumericFiltersToUrl = useCallback((nextFilters) => {
    const minN = parseNumeric(nextFilters.min_price);
    const maxN = parseNumeric(nextFilters.max_price);
    if (minN != null && maxN != null && maxN < minN) {
      setPriceRangeError(
        locale === "ar"
          ? "يجب أن يكون الحد الأقصى للسعر أكبر من أو يساوي الحد الأدنى"
          : "Max price must be greater than or equal to min price"
      );
      return;
    }
    setPriceRangeError("");

    const newParams = new URLSearchParams(window.location.search);

    const setOrDelete = (key, v) => {
      if (v && String(v).trim() !== "") newParams.set(key, String(v));
      else newParams.delete(key);
    };

    setOrDelete("min_price", nextFilters.min_price);
    setOrDelete("max_price", nextFilters.max_price);
    setOrDelete("min_area", nextFilters.min_area);

    router.push(`${window.location.pathname}?${newParams.toString()}`);
    setActiveFilters(buildActiveFilters(nextFilters));
  }, [router, buildActiveFilters, parseNumeric, locale]);

  const scheduleNumericSearch = useCallback((nextFilters) => {
    if (numericDebounceRef.current) clearTimeout(numericDebounceRef.current);
    numericDebounceRef.current = setTimeout(() => {
      applyNumericFiltersToUrl(nextFilters);
    }, 1000);
  }, [applyNumericFiltersToUrl]);

  const flushNumericSearch = useCallback((nextFilters) => {
    if (numericDebounceRef.current) clearTimeout(numericDebounceRef.current);
    applyNumericFiltersToUrl(nextFilters);
  }, [applyNumericFiltersToUrl]);

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);

    // Update URL parameters
    const newParams = new URLSearchParams(window.location.search);

    // Handle different filter types
    if (key === "my_inventory" || key === "resale") {
      // Boolean toggles
      if (value) {
        newParams.set(key, "true");
      } else {
        newParams.delete(key);
      }
    } else if (key === "min_area" || key === "min_price" || key === "max_price") {
      // Numeric filters are applied via debounce/onBlur, not here.
      // Keep URL changes centralized in applyNumericFiltersToUrl().
      scheduleNumericSearch(updatedFilters);
      return;
    } else {
      // Existing filters
      if (value && value !== "" && value !== "all") {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    }

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    
    // Update URL - this will trigger Next.js to re-render with new searchParams
    router.push(newUrl);

    // Force refresh: If project_name changed, invalidate unit queries to force fresh API call
    // This ensures the API is called immediately with the new project filter
    if (key === "project_name") {
      // Invalidate all unit list queries - this causes matching queries to refetch immediately
      // When the component re-render with new searchParams, the query key changes
      // and the invalidated queries will be refetched to get fresh data
      // Using refetchType: 'active' ensures only currently mounted queries refetch
      queryClient.invalidateQueries({ 
        queryKey: unitKeys.lists(),
        refetchType: 'active' // Only refetch active queries (currently mounted components)
      });
    }

    // Update active filters
    setActiveFilters((prev) => {
      const existingFilterIndex = prev.findIndex((f) => f.key === key);
      
      // Determine display value for new filters
      let displayValue = value;
      if (key === "my_inventory") {
        displayValue = t.unitsFilter.myInventory;
      } else if (key === "resale") {
        displayValue = t.unitsFilter.resale;
      } else if (key === "min_price") {
        displayValue = value ? `${locale === "ar" ? "من" : "From"} ${formatPriceInput(value)} EGP` : "";
      } else if (key === "max_price") {
        displayValue = value ? `${locale === "ar" ? "إلى" : "To"} ${formatPriceInput(value)} EGP` : "";
      }
      
      if (existingFilterIndex > -1) {
        // Update existing filter
        if (displayValue && displayValue !== "") {
          const updatedFilter = { ...prev[existingFilterIndex], value: displayValue };
          return [
            ...prev.slice(0, existingFilterIndex),
            updatedFilter,
            ...prev.slice(existingFilterIndex + 1),
          ];
        } else {
          // Remove filter if value is empty
          return prev.filter((f) => f.key !== key);
        }
      } else {
        // Add new filter
        if (displayValue && displayValue !== "") {
          return [...prev, { key, value: displayValue }];
        }
        return prev;
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
      my_inventory: false,
      resale: false,
      min_area: "",
    });

    router.push(window.location.pathname);

    setActiveFilters([]);
  };

  // Function to remove a specific filter
  const handleRemoveFilter = (key) => {
    const newParams = new URLSearchParams(window.location.search);

    // Special handling for different filter types
    if (key === "price_range") {
      newParams.delete("min_price");
      newParams.delete("max_price");
      setFilters((prev) => ({
        ...prev,
        min_price: "",
        max_price: "",
      }));
    } else if (key === "my_inventory" || key === "resale") {
      // Boolean toggles
      setFilters((prev) => ({ ...prev, [key]: false }));
      newParams.delete(key);
    } else if (key === "min_area") {
      // Min area input
      setFilters((prev) => ({ ...prev, min_area: "" }));
      newParams.delete("min_area");
    } else if (key === "min_price" || key === "max_price") {
      // Price fields
      setFilters((prev) => ({ ...prev, [key]: "" }));
      newParams.delete(key);
    } else {
      // Existing filters
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
      case "my_inventory":
        return t.unitsFilter.myInventory;
      case "resale":
        return t.unitsFilter.resale;
      case "min_area":
        return value || t.unitsFilter.minArea;
      case "min_price":
        return value ? `${locale === "ar" ? "من" : "From"} ${formatPriceInput(value)} EGP` : "";
      case "max_price":
        return value ? `${locale === "ar" ? "إلى" : "To"} ${formatPriceInput(value)} EGP` : "";
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
      {/* Line 1: Primary Filters + Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Cities Dropdown */}
        <div className="flex-1 min-w-[140px] max-w-[200px]">
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
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Developer Dropdown */}
        <div className="flex-1 min-w-[140px] max-w-[200px]">
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
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Compounds Dropdown */}
        <div className="flex-1 min-w-[140px] max-w-[200px]">
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
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Purpose Dropdown */}
        <div className="flex-1 min-w-[120px] max-w-[160px]">
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
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Property Type Dropdown */}
        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <SearchableDropdownSelect
            options={BUILDING_TYPES}
            value={filters.property_type === "all" ? "" : filters.property_type}
            onChange={(e) => {
              const propertyTypeValue = e.target.value || "all";
              handleFilterChange("property_type", propertyTypeValue);
            }}
            name="property_type"
            getValue={(type) => type.value}
            getLabel={(type, currentLocale) => {
              const key = String(type?.value || "").toLowerCase();
              // UI label is localized; API value remains `type.value` (English enum).
              return (
                translate(`buildingTypes.${key}`) ||
                (currentLocale === "ar" ? type.ar_label : type.en_label) ||
                type.value
              );
            }}
            searchFields={["en_label", "ar_label", "value"]}
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allPropertyTypes || "All Property Types"}
            placeholder={t.unitsFilter.allPropertyTypes || "All Property Types"}
            searchPlaceholder={locale === "ar" ? "ابحث عن نوع العقار..." : "Search property types..."}
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Actions */}
        {!isPublic && (
          <div className="flex gap-2 items-center ml-auto">
            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="px-3 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              <FileSpreadsheet size={16} className="shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap text-xs">
                {t.uploadExcel?.button || "Upload"}
              </span>
            </button>
            <AddUnitButton className="px-3 py-2 h-10 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-1 transition-colors shadow-sm hover:shadow-md" />
          </div>
        )}
      </div>

      {/* Line 2: Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* My Inventory Toggle */}
        <div className="flex-shrink-0">
          <label
            className={`flex items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium select-none ${
              myInventory
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
            } ${!hasClientId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            title={!hasClientId ? (locale === "ar" ? "يتطلب تسجيل الدخول" : "Requires login") : ""}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={myInventory}
              disabled={!hasClientId}
              onChange={(e) => {
                const checked = e.target.checked;
                setMyInventory(checked);
                setFilters((prev) => ({ ...prev, my_inventory: checked }));
                handleFilterChange("my_inventory", checked);
              }}
            />
            <span className="truncate text-xs">{t.unitsFilter.myInventory}</span>
          </label>
        </div>

        {/* Resale Toggle */}
        <div className="flex-shrink-0">
          <label
            className={`flex items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium cursor-pointer select-none ${
              resale
                ? "bg-orange-50 border-orange-300 text-orange-700"
                : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-600"
              checked={resale}
              onChange={(e) => {
                const checked = e.target.checked;
                setResale(checked);
                setFilters((prev) => ({ ...prev, resale: checked }));
                handleFilterChange("resale", checked);
              }}
            />
            <span className="truncate text-xs">{t.unitsFilter.resale}</span>
          </label>
        </div>

        {/* Min Price Field — ~70% of prior ~248px effective width */}
        <div className="flex-shrink-0 w-[10.85rem] min-w-0">
          <LenaTextField
            name="min_price"
            type="money"
            label={locale === "ar" ? "الحد الأدنى للسعر" : "Min Price"}
            value={filters.min_price}
            error={priceRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              const next = { ...filters, min_price: value };
              setFilters(next);
              scheduleNumericSearch(next);
            }}
            onBlur={() => flushNumericSearch(filters)}
            className="w-full min-w-0"
            adornment="EGP"
          />
        </div>

        {/* Max Price Field */}
        <div className="flex-shrink-0 w-[10.85rem] min-w-0">
          <LenaTextField
            name="max_price"
            type="money"
            label={locale === "ar" ? "الحد الأقصى للسعر" : "Max Price"}
            value={filters.max_price}
            error={priceRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              const next = { ...filters, max_price: value };
              setFilters(next);
              scheduleNumericSearch(next);
            }}
            onBlur={() => flushNumericSearch(filters)}
            className="w-full min-w-0"
            adornment="EGP"
          />
        </div>

        {/* Min Area Field */}
        <div className="flex-shrink-0 w-[10.85rem] min-w-0">
          <LenaTextField
            name="min_area"
            type="number"
            label={t.unitsFilter.minArea}
            value={filters.min_area}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              const next = { ...filters, min_area: value };
              setFilters(next);
              scheduleNumericSearch(next);
            }}
            onBlur={() => flushNumericSearch(filters)}
            className="w-full min-w-0"
            adornment="m²"
          />
        </div>
      </div>

      {/* Line 3: Active Filters - Keep as is */}
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
