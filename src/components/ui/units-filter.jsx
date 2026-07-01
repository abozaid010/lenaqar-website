"use client";

import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useProjectsNames, useDeveloperNames } from "@/hooks/use-admin-shared-data";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { ChevronDown, FileSpreadsheet, Trash2, X } from "lucide-react";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableDistrictSelect from "@/components/ui/inputs/searchable-district-select";
import SearchableSubDistrictSelect from "@/components/ui/inputs/searchable-sub-district-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unitKeys } from "@/utils/query-utils";
import LoadingSpinner from "./loading-spinner";
import UploadUnitsExcelDialog from "./upload-units-excel-dialog";
import toast from "react-hot-toast";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { BULK_AVAILABILITY_DEFAULT_MESSAGE_AR } from "@/lib/units/unit-whatsapp-recipient";

// Helper functions defined outside component to avoid hoisting/initialization issues
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

function formatPriceInput(value) {
  if (!value) return "";
  // Remove all non-digit characters
  const numericValue = value.replace(/\D/g, "");
  // Format with commas
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const parseNumeric = (v) => {
  if (v === undefined || v === null) return null;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  // URL is the single source of truth for all filter values.
  // Derived from searchParams so they always reflect the actual URL.
  const filters = useMemo(() => ({
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
    sub_district: searchParams.get("sub_district") || "",
    developer_name: searchParams.get("developer_name") || "",
    project_name: searchParams.get("project_name") || "",
    purpose: searchParams.get("purpose") || "",
    property_type: searchParams.get("property_type") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    min_area: searchParams.get("min_area") || "",
    max_area: searchParams.get("max_area") || "",
    my_inventory: searchParams.get("my_inventory") === "true",
    resale: searchParams.get("resale") === "true",
  }), [searchParams]);

  // Local state only for debounced numeric inputs so the user can type freely
  // without every keystroke hitting the URL. Synced from URL on external changes.
  const [localMinPrice, setLocalMinPrice] = useState(filters.min_price);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.max_price);
  const [localMinArea, setLocalMinArea] = useState(filters.min_area);
  const [localMaxArea, setLocalMaxArea] = useState(filters.max_area);

  // Sync local numeric inputs when URL changes externally (browser back/forward)
  useEffect(() => {
    setLocalMinPrice(searchParams.get("min_price") || "");
    setLocalMaxPrice(searchParams.get("max_price") || "");
    setLocalMinArea(searchParams.get("min_area") || "");
    setLocalMaxArea(searchParams.get("max_area") || "");
  }, [searchParams]);

  const [priceRangeError, setPriceRangeError] = useState("");
  const [areaRangeError, setAreaRangeError] = useState("");

  // Debounced numeric search (price/area) to avoid spamming backend
  const numericDebounceRef = useRef(null);

  // Get client ID from token for My Inventory filter.
  // IMPORTANT: compute on mount only to avoid SSR hydration mismatch.
  const [hasClientId, setHasClientId] = useState(false);
  useEffect(() => {
    setHasClientId(!!getClientIdFromToken());
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
    const loadDistrictLabels = async () => {
      try {
        const manager = (await import("@/utils/city_manager")).default.getInstance();
        const districts = await manager.getDistrictsWithLabels(null, locale);
        const labels = {};

        for (const district of districts) {
          labels[district.value] = district.label;
        }

        setDistrictLabels(labels);
      } catch (error) {
        console.error("Failed to load district labels:", error);
      }
    };

    loadDistrictLabels();
  }, [locale]);

  useEffect(() => {
    const loadSubDistrictLabels = async () => {
      try {
        if (
          !filters.city ||
          filters.city === "all" ||
          !filters.district ||
          filters.district === "all"
        ) {
          setSubDistrictLabels({});
          return;
        }

        const manager = (await import("@/utils/city_manager")).default.getInstance();
        const cityObj = await manager.getCityByValue(filters.city);
        if (!cityObj) {
          setSubDistrictLabels({});
          return;
        }

        const subs = await manager.getSubDistrictsWithLabels(
          cityObj.id,
          String(filters.district).toLowerCase().trim(),
          locale
        );

        const labels = {};
        for (const sd of subs) {
          labels[sd.value] = sd.label;
        }
        setSubDistrictLabels(labels);
      } catch (error) {
        console.error("Failed to load sub-district labels:", error);
      }
    };

    loadSubDistrictLabels();
  }, [locale, filters.city, filters.district]);

  useEffect(() => {
    return () => {
      if (numericDebounceRef.current) clearTimeout(numericDebounceRef.current);
    };
  }, []);

  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [cityLabels, setCityLabels] = useState({});
  const [districtLabels, setDistrictLabels] = useState({});
  const [subDistrictLabels, setSubDistrictLabels] = useState({});
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const bulkSelection = useUnitsBulkSelectionOptional();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showBulkToolbar =
    !isPublic && isMounted && canShowBulkButton && bulkSelection;

  const defaultAvailabilityMessage = BULK_AVAILABILITY_DEFAULT_MESSAGE_AR;

  const handleOpenCheckAvailability = () => {
    if (!bulkSelection || bulkSelection.resolvedRecipients.length === 0) {
      toast.error(
        translate(
          "unitsFilter.bulkAvailability.noRecipients",
          "Selected units have no valid owner phone numbers."
        )
      );
      return;
    }
    setIsWhatsappBulkOpen(true);
  };

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
    if (nextFilters.min_area || nextFilters.max_area) {
      const min = nextFilters.min_area || "";
      const max = nextFilters.max_area || "";
      let value = t.unitsFilter.minArea;
      if (min && max) value = `${min} - ${max} m²`;
      else if (min) value = `${t.unitsFilter.minArea}: ${min} m²`;
      else if (max) value = `${t.unitsFilter.maxArea}: ${max} m²`;
      list.push({ key: "area_range", value });
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
    if (nextFilters.district) {
      list.push({ key: "district", value: getSelectedDistrict() });
    }
    if (nextFilters.sub_district) {
      list.push({ key: "sub_district", value: getSelectedSubDistrict() });
    }
    return list;
  }, [locale, t, compounds, developers, cityLabels, districtLabels, subDistrictLabels, filters.city, filters.district]);

  // Only show active developer filter if developer exists in loaded list
  // This prevents showing stale filter chips when data reloads
  const hasValidDeveloper = useMemo(() => {
    if (!filters.developer_name || filters.developer_name === "all") return false;
    return developers.some((d) => getDeveloperValue(d) === filters.developer_name);
  }, [filters.developer_name, developers]);

  // Derived from URL — automatically stays in sync with searchParams
  const activeFilters = useMemo(() => {
    // Temporarily override developer_name validity for buildActiveFilters
    const safeFilters = {
      ...filters,
      developer_name: hasValidDeveloper ? filters.developer_name : "",
    };
    return buildActiveFilters(safeFilters);
  }, [filters, buildActiveFilters, hasValidDeveloper]);

  const applyNumericFiltersToUrl = useCallback((nextFilters) => {
    const minPriceN = parseNumeric(nextFilters.min_price);
    const maxPriceN = parseNumeric(nextFilters.max_price);
    if (minPriceN != null && maxPriceN != null && maxPriceN < minPriceN) {
      setPriceRangeError(
        locale === "ar"
          ? "يجب أن يكون الحد الأقصى للسعر أكبر من أو يساوي الحد الأدنى"
          : "Max price must be greater than or equal to min price"
      );
      return;
    }
    setPriceRangeError("");

    const minAreaN = parseNumeric(nextFilters.min_area);
    const maxAreaN = parseNumeric(nextFilters.max_area);
    if (minAreaN != null && maxAreaN != null && maxAreaN < minAreaN) {
      setAreaRangeError(
        locale === "ar"
          ? "يجب أن يكون الحد الأقصى للمساحة أكبر من أو يساوي الحد الأدنى"
          : "Max area must be greater than or equal to min area"
      );
      return;
    }
    setAreaRangeError("");

    const newParams = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key, v) => {
      if (v && String(v).trim() !== "") newParams.set(key, String(v));
      else newParams.delete(key);
    };

    setOrDelete("min_price", nextFilters.min_price);
    setOrDelete("max_price", nextFilters.max_price);
    setOrDelete("min_area", nextFilters.min_area);
    setOrDelete("max_area", nextFilters.max_area);

    const qs = newParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, searchParams, pathname, locale]);

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
    // Update URL parameters — URL is the single source of truth
    const newParams = new URLSearchParams(searchParams.toString());

    // Handle different filter types
    if (key === "my_inventory" || key === "resale") {
      // Boolean toggles
      if (value) {
        newParams.set(key, "true");
      } else {
        newParams.delete(key);
      }
    } else if (key === "min_area" || key === "max_area" || key === "min_price" || key === "max_price") {
      // Numeric filters are applied via debounce/onBlur, not here.
      // Keep URL changes centralized in applyNumericFiltersToUrl().
      scheduleNumericSearch({ ...filters, [key]: value });
      return;
    } else {
      // Existing filters
      if (value && value !== "" && value !== "all") {
        const normalizedValue =
          key === "district" ? String(value).toLowerCase().trim() : value;
        newParams.set(key, normalizedValue);
      } else {
        newParams.delete(key);
      }
    }

    if (key === "city") {
      newParams.delete("district");
      newParams.delete("sub_district");
      newParams.delete("project_name");
    }
    if (key === "district") {
      newParams.delete("sub_district");
      newParams.delete("project_name");
    }

    const qs = newParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    if (key === "project_name") {
      queryClient.invalidateQueries({
        queryKey: unitKeys.lists(),
        refetchType: "active",
      });
    }
  };

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (localMinPrice) newParams.set("min_price", localMinPrice);
    else newParams.delete("min_price");

    if (localMaxPrice) newParams.set("max_price", localMaxPrice);
    else newParams.delete("max_price");

    const qs = newParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setIsPriceDropdownOpen(false);
  };

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
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setLocalMinArea("");
    setLocalMaxArea("");
    router.replace(pathname, { scroll: false });
  };

  // Function to remove a specific filter
  const handleRemoveFilter = (key) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (key === "price_range") {
      newParams.delete("min_price");
      newParams.delete("max_price");
      setLocalMinPrice("");
      setLocalMaxPrice("");
    } else if (key === "area_range") {
      newParams.delete("min_area");
      newParams.delete("max_area");
      setLocalMinArea("");
      setLocalMaxArea("");
    } else if (key === "min_area") {
      newParams.delete("min_area");
      setLocalMinArea("");
    } else if (key === "max_area") {
      newParams.delete("max_area");
      setLocalMaxArea("");
    } else if (key === "min_price") {
      newParams.delete("min_price");
      setLocalMinPrice("");
    } else if (key === "max_price") {
      newParams.delete("max_price");
      setLocalMaxPrice("");
    } else {
      newParams.delete(key);
    }

    const qs = newParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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

  function getSelectedDeveloper() {
    if (!filters.developer_name || filters.developer_name === "all") {
      return t.unitsFilter.allDevelopers || "All Developers";
    }
    // Only show developer name if it exists in the loaded developers list
    // This prevents displaying stale/cached values that don't match current data
    const d = developers.find((d) => getDeveloperValue(d) === filters.developer_name);
    if (!d) {
      // If developer not found in list, return "All Developers" instead of raw value
      // This handles race conditions where filter loads before data
      return t.unitsFilter.allDevelopers || "All Developers";
    }
    return getDeveloperLabel(d, locale) || filters.developer_name;
  }

  function getSelectedCity() {
    if (!filters.city || filters.city === "all" || filters.city === "") {
      return t.unitsFilter.allCities || "All Cities";
    }
    return cityLabels[filters.city] || filters.city;
  }

  function getSelectedDistrict() {
    if (!filters.district || filters.district === "all" || filters.district === "") {
      return translate("unitsFilter.allDistricts", "All Districts");
    }
    return districtLabels[filters.district] || filters.district;
  }

  function getSelectedSubDistrict() {
    if (
      !filters.sub_district ||
      filters.sub_district === "all" ||
      filters.sub_district === ""
    ) {
      return translate("unitsFilter.allSubDistricts", "All Sub-districts");
    }
    return subDistrictLabels[filters.sub_district] || filters.sub_district;
  }

  function getFilterDisplayText(key, value) {
    switch (key) {
      case "my_inventory":
        return t.unitsFilter.myInventory;
      case "resale":
        return t.unitsFilter.resale;
      case "min_area":
        return value || t.unitsFilter.minArea;
      case "max_area":
        return value || t.unitsFilter.maxArea;
      case "area_range":
        return value;
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
      case "district":
        return getSelectedDistrict();
      case "sub_district":
        return getSelectedSubDistrict();
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

        {/* District Dropdown */}
        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <SearchableDistrictSelect
            value={filters.district === "all" ? "" : filters.district}
            onChange={(e) => {
              const districtValue = e.target.value || "all";
              handleFilterChange("district", districtValue);
            }}
            name="district"
            city={filters.city && filters.city !== "all" ? filters.city : ""}
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allDistricts", "All Districts")}
            placeholder={translate("unitsFilter.allDistricts", "All Districts")}
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Sub-district Dropdown */}
        <div className="flex-1 min-w-[140px] max-w-[220px]">
          <SearchableSubDistrictSelect
            value={filters.sub_district === "all" ? "" : filters.sub_district}
            onChange={(e) => {
              const subValue = e.target.value || "all";
              handleFilterChange("sub_district", subValue);
            }}
            name="sub_district"
            city={filters.city && filters.city !== "all" ? filters.city : ""}
            district={filters.district && filters.district !== "all" ? filters.district : ""}
            disabled={
              !filters.city ||
              filters.city === "all" ||
              !filters.district ||
              filters.district === "all"
            }
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allSubDistricts", "All Sub-districts")}
            placeholder={translate("unitsFilter.allSubDistricts", "All Sub-districts")}
            buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full"
          />
        </div>

        {/* Developer Dropdown — temporarily hidden; filter by developer not needed at this stage
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
        */}

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
            city={filters.city && filters.city !== "all" ? filters.city : ""}
            district={filters.district && filters.district !== "all" ? filters.district : ""}
            isPublic={isPublic}
            isLoading={projectsLoading}
            showAllOption={true}
            allOptionLabel={t.unitsFilter.allCompounds || "All Projects"}
            placeholder={t.unitsFilter.allCompounds || "All Projects"}
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
        {/* Purpose — none selected = all; rent/sell sent to API when chosen */}
        <div className="flex-shrink-0">
          <p className="text-xs font-medium text-[#494A4B] mb-1.5">
            {translate("unitsFilter.purpose", "Purpose")}
          </p>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={translate("unitsFilter.purpose", "Purpose")}
          >
            {[
              {
                value: "rent",
                label: translate("unitsFilter.purposes.rent", "Rent"),
              },
              {
                value: "sell",
                label: translate("unitsFilter.purposes.sell", "Sell"),
              },
            ].map((option) => {
              const isSelected = filters.purpose === option.value;

              return (
                <label
                  key={option.value}
                  onClick={(e) => {
                    if (isSelected) {
                      e.preventDefault();
                      handleFilterChange("purpose", "all");
                    }
                  }}
                  className={`flex items-center gap-2 h-10 px-3 rounded-md border text-xs font-medium cursor-pointer select-none transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="purpose"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => handleFilterChange("purpose", option.value)}
                    className="h-4 w-4 accent-primary shrink-0"
                  />
                  <span className="whitespace-nowrap">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* My Inventory Toggle */}
        <div className="flex-shrink-0">
          <label
            className={`flex items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium select-none ${
              filters.my_inventory
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
            } ${!hasClientId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            title={!hasClientId ? (locale === "ar" ? "يتطلب تسجيل الدخول" : "Requires login") : ""}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={filters.my_inventory}
              disabled={!hasClientId}
              onChange={(e) => handleFilterChange("my_inventory", e.target.checked)}
            />
            <span className="truncate text-xs">{t.unitsFilter.myInventory}</span>
          </label>
        </div>

        {/* Resale Toggle */}
        <div className="flex-shrink-0">
          <label
            className={`flex items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium cursor-pointer select-none ${
              filters.resale
                ? "bg-orange-50 border-orange-300 text-orange-700"
                : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-600"
              checked={filters.resale}
              onChange={(e) => handleFilterChange("resale", e.target.checked)}
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
            value={localMinPrice}
            error={priceRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setLocalMinPrice(value);
              scheduleNumericSearch({ ...filters, min_price: value });
            }}
            onBlur={() => flushNumericSearch({ ...filters, min_price: localMinPrice })}
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
            value={localMaxPrice}
            error={priceRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setLocalMaxPrice(value);
              scheduleNumericSearch({ ...filters, max_price: value });
            }}
            onBlur={() => flushNumericSearch({ ...filters, max_price: localMaxPrice })}
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
            value={localMinArea}
            error={areaRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setLocalMinArea(value);
              scheduleNumericSearch({ ...filters, min_area: value });
            }}
            onBlur={() => flushNumericSearch({ ...filters, min_area: localMinArea })}
            className="w-full min-w-0"
            adornment="m²"
          />
        </div>

        {/* Max Area Field */}
        <div className="flex-shrink-0 w-[10.85rem] min-w-0">
          <LenaTextField
            name="max_area"
            type="number"
            label={translate("unitsFilter.maxArea", "Max Area")}
            value={localMaxArea}
            error={areaRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setLocalMaxArea(value);
              scheduleNumericSearch({ ...filters, max_area: value });
            }}
            onBlur={() => flushNumericSearch({ ...filters, max_area: localMaxArea })}
            className="w-full min-w-0"
            adornment="m²"
          />
        </div>
      </div>

      {showBulkToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={bulkSelection.allSelectableVisibleSelected}
              disabled={bulkSelection.selectableVisibleCount === 0}
              onChange={() => bulkSelection.toggleSelectAllVisible()}
            />
            <span className="text-xs">
              {translate(
                "unitsFilter.bulkAvailability.selectAll",
                "Select all on page"
              )}
            </span>
          </label>

          {bulkSelection.hasSelection && (
            <span className="text-xs text-gray-600">
              {translate(
                "unitsFilter.bulkAvailability.selectedUnits",
                "{count} selected"
              ).replace("{count}", String(bulkSelection.selectedUnitIds.size))}
            </span>
          )}

          {bulkSelection.hasSelection && (
            <button
              type="button"
              onClick={handleOpenCheckAvailability}
              className="flex items-center gap-2 px-3 sm:px-4 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 h-9 min-h-[36px]"
              title={translate(
                "unitsFilter.bulkAvailability.checkButton",
                "Check Availability"
              )}
            >
              <svg
                className="w-4 h-4 text-green-600 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
              </svg>
              <span className="hidden sm:inline">
                {translate(
                  "unitsFilter.bulkAvailability.checkButton",
                  "Check Availability"
                )}
              </span>
            </button>
          )}
        </div>
      )}

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

      {showBulkToolbar && (
        <AddNewWhatsappCampaignDialog
          isOpen={isWhatsappBulkOpen}
          onClose={() => setIsWhatsappBulkOpen(false)}
          recipients={bulkSelection.resolvedRecipients}
          defaultAutomationMessage={defaultAvailabilityMessage}
          appendUnitLinkPerRecipient
          onSendSuccess={() => bulkSelection.clearUnitSelection()}
        />
      )}
    </div>
  );
}
