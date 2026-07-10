"use client";

import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useProjectsNames, useDeveloperNames } from "@/hooks/use-admin-shared-data";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { FileSpreadsheet, Trash2, X } from "lucide-react";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableDistrictSelect from "@/components/ui/inputs/searchable-district-select";
import SearchableSubDistrictSelect from "@/components/ui/inputs/searchable-sub-district-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchablePropertyTypeSelect from "@/components/ui/inputs/searchable-property-type-select";
import SearchableFurnishingTypeSelect from "@/components/ui/inputs/searchable-furnishing-type-select";
import { getFurnishingTypes } from "@/data/constants";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import UploadUnitsExcelDialog from "./upload-units-excel-dialog";
import toast from "react-hot-toast";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { BULK_AVAILABILITY_DEFAULT_MESSAGE_AR } from "@/lib/units/unit-whatsapp-recipient";
import { createEmptyFilters } from "@/lib/units/favorite-searches";
import { useUnitsFilterDraft } from "@/hooks/use-units-filter-draft";
import UnitsFavoriteSearches from "@/components/ui/units-favorite-searches";

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

const valuesMatch = (a, b) => {
  if (a == null || b == null) return a === b;
  return String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
};

const resolveProjectEnName = (projects, raw) => {
  if (!raw || !Array.isArray(projects) || projects.length === 0) return raw;
  const match =
    projects.find((p) => valuesMatch(p.en_name, raw)) ||
    projects.find((p) => p.ar_name === raw || valuesMatch(p.ar_name, raw));
  return match?.en_name || raw;
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

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const FURNISHING_TYPES = useMemo(() => {
    return getFurnishingTypes({
      en: { unitDetails: { furnishingTypes: en.unitDetails?.furnishingTypes || {} } },
      ar: { unitDetails: { furnishingTypes: ar.unitDetails?.furnishingTypes || {} } },
    });
  }, []);

  // URL = applied filters (API). Draft = form state until Apply / Enter / 5s debounce.
  const {
    appliedFilters: filters,
    draftFilters,
    hasPendingChanges,
    priceRangeError,
    areaRangeError,
    updateDraftFilters,
    applyDraftFilters,
    applyExternalFilters,
    clearAllFilters,
    removeFilterKey,
  } = useUnitsFilterDraft({
    searchParams,
    pathname,
    router,
    isPublic,
    locale,
  });

  // Normalize filter params in URL to canonical English values for the API.
  useEffect(() => {
    let cancelled = false;

    const normalizeFilterParams = async () => {
      const city = searchParams.get("city");
      const district = searchParams.get("district");
      const subDistrict = searchParams.get("sub_district");
      const projectName = searchParams.get("project_name");
      const propertyType = searchParams.get("property_type");
      const furnishedType = searchParams.get("furnished_type");

      if (!city && !district && !subDistrict && !projectName && !propertyType && !furnishedType) {
        return;
      }

      try {
        const newParams = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (city || district || subDistrict) {
          const manager = (await import("@/utils/city_manager")).default.getInstance();
          await manager.initializeData();

          let normCity = city || "";
          if (city) {
            normCity = manager.normalizeCityValue(city);
            if (normCity !== city) {
              newParams.set("city", normCity);
              changed = true;
            }
          }

          let normDistrict = district || "";
          if (district && normCity) {
            normDistrict = manager.normalizeDistrictValue(district, normCity);
            if (normDistrict !== district) {
              newParams.set("district", normDistrict);
              changed = true;
            }
          }

          if (subDistrict && normCity && normDistrict) {
            const normSub = manager.normalizeSubDistrictValue(
              subDistrict,
              normCity,
              normDistrict
            );
            if (normSub !== subDistrict) {
              newParams.set("sub_district", normSub);
              changed = true;
            }
          }
        }

        if (projectName && compounds.length > 0) {
          const normProject = resolveProjectEnName(compounds, projectName);
          if (normProject !== projectName) {
            newParams.set("project_name", normProject);
            changed = true;
          }
        }

        if (propertyType) {
          const match =
            BUILDING_TYPES.find((type) => valuesMatch(type.value, propertyType)) ||
            BUILDING_TYPES.find(
              (type) => type.ar_label === propertyType || type.en_label === propertyType
            );
          if (match && match.value !== propertyType) {
            newParams.set("property_type", match.value);
            changed = true;
          }
        }

        if (furnishedType) {
          const match =
            FURNISHING_TYPES.find((type) => valuesMatch(type.value, furnishedType)) ||
            FURNISHING_TYPES.find(
              (type) => type.ar_label === furnishedType || type.en_label === furnishedType
            );
          if (match && match.value !== furnishedType) {
            newParams.set("furnished_type", match.value);
            changed = true;
          }
        }

        if (!cancelled && changed) {
          const qs = newParams.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to normalize filter params:", error);
      }
    };

    normalizeFilterParams();
    return () => {
      cancelled = true;
    };
  }, [searchParams, pathname, router, compounds, BUILDING_TYPES, FURNISHING_TYPES]);

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
          !draftFilters.city ||
          draftFilters.city === "all" ||
          !draftFilters.district ||
          draftFilters.district === "all"
        ) {
          setSubDistrictLabels({});
          return;
        }

        const manager = (await import("@/utils/city_manager")).default.getInstance();
        const cityObj = await manager.getCityByValue(draftFilters.city);
        if (!cityObj) {
          setSubDistrictLabels({});
          return;
        }

        const subs = await manager.getSubDistrictsWithLabels(
          cityObj.id,
          String(draftFilters.district).toLowerCase().trim(),
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
  }, [locale, draftFilters.city, draftFilters.district]);

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
    if (nextFilters.furnished_type) {
      list.push({ key: "furnished_type", value: nextFilters.furnished_type });
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

  // Derived from URL — chips reflect applied filters only
  const activeFilters = useMemo(() => {
    const safeFilters = {
      ...filters,
      developer_name: hasValidDeveloper ? filters.developer_name : "",
    };
    return buildActiveFilters(safeFilters);
  }, [filters, buildActiveFilters, hasValidDeveloper]);

  const handleFilterChange = (key, value) => {
    updateDraftFilters((prev) => {
      const next = { ...prev };

      if (key === "my_inventory" || key === "resale") {
        next[key] = Boolean(value);
      } else if (
        key === "min_area" ||
        key === "max_area" ||
        key === "min_price" ||
        key === "max_price"
      ) {
        next[key] = value == null ? "" : String(value);
      } else if (value && value !== "" && value !== "all") {
        let normalizedValue = value;

        if (key === "city" || key === "district" || key === "sub_district") {
          normalizedValue = String(value).toLowerCase().trim();
        } else if (key === "project_name") {
          normalizedValue = resolveProjectEnName(compounds, value);
        } else if (key === "property_type") {
          const type =
            BUILDING_TYPES.find((t) => valuesMatch(t.value, value)) ||
            BUILDING_TYPES.find(
              (t) => t.ar_label === value || t.en_label === value
            );
          normalizedValue = type?.value || String(value).trim();
        } else if (key === "furnished_type") {
          const type =
            FURNISHING_TYPES.find((t) => valuesMatch(t.value, value)) ||
            FURNISHING_TYPES.find(
              (t) => t.ar_label === value || t.en_label === value
            );
          normalizedValue = type?.value || String(value).trim();
        }

        next[key] = normalizedValue;
      } else {
        next[key] = "";
      }

      if (key === "city") {
        next.district = "";
        next.sub_district = "";
        next.project_name = "";
      }
      if (key === "district") {
        next.sub_district = "";
        next.project_name = "";
      }

      return next;
    });
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

  const handleRemoveAllFilters = () => {
    clearAllFilters();
  };

  const handleRemoveFilter = (key) => {
    removeFilterKey(key);
  };

  const applyFavoriteSearch = useCallback(
    (savedFilters) => {
      applyExternalFilters({ ...createEmptyFilters(), ...savedFilters });
    },
    [applyExternalFilters]
  );

  const handleApplyFiltersSubmit = (event) => {
    event.preventDefault();
    applyDraftFilters();
  };

  function getSelectedPropertyType() {
    if (!filters.property_type || filters.property_type === "all") {
      return t.unitsFilter.allPropertyTypes || "All Property Types";
    }
    const type = BUILDING_TYPES.find((bt) =>
      valuesMatch(bt.value, filters.property_type)
    );
    if (!type) return filters.property_type;
    const key = String(type.value).toLowerCase();
    return (
      translate(`buildingTypes.${key}`) ||
      (locale === "ar" ? type.ar_label : type.en_label) ||
      type.value
    );
  }

  function getSelectedFurnishingType() {
    if (!filters.furnished_type || filters.furnished_type === "all") {
      return translate("unitsFilter.allFurnishingTypes", "All Furnishing Types");
    }
    const type = FURNISHING_TYPES.find((ft) =>
      valuesMatch(ft.value, filters.furnished_type)
    );
    if (!type) return filters.furnished_type;
    const key = String(type.value).toLowerCase();
    const translationKeys = {
      furnished: "property.furnishing.furnished",
      unfurnished: "property.furnishing.unfurnished",
      hotel_furnished: "property.furnishing.hotelFurnished",
      "partially furnished": "property.furnishing.partiallyFurnished",
      "semi furnished": "property.furnishing.semiFurnished",
      flixy: "property.furnishing.flixy",
      turnkey: "property.furnishing.turnkey",
    };
    return (
      translate(translationKeys[key]) ||
      (locale === "ar" ? type.ar_label : type.en_label) ||
      type.value
    );
  }

  function getSelectedProjectName() {
    if (!filters.project_name || filters.project_name === "all") {
      return t.unitsFilter.allCompounds || "All Projects";
    }
    const c = compounds.find((c) => valuesMatch(c.en_name, filters.project_name));
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
      case "furnished_type":
        return getSelectedFurnishingType();
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

  const filterButtonClassName =
    "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full";

  const buildSummaryLabelsFromFilters = useCallback(
    (filterValues) => {
      const labels = [];

      if (filterValues.my_inventory) labels.push(t.unitsFilter.myInventory);
      if (filterValues.resale) labels.push(t.unitsFilter.resale);

      if (filterValues.min_area || filterValues.max_area) {
        const min = filterValues.min_area || "";
        const max = filterValues.max_area || "";
        if (min && max) labels.push(`${min} - ${max} m²`);
        else if (min) labels.push(`${t.unitsFilter.minArea}: ${min} m²`);
        else if (max) labels.push(`${t.unitsFilter.maxArea}: ${max} m²`);
      }

      if (filterValues.developer_name) {
        const developer = developers.find(
          (item) => getDeveloperValue(item) === filterValues.developer_name
        );
        labels.push(
          developer
            ? getDeveloperLabel(developer, locale)
            : filterValues.developer_name
        );
      }

      if (filterValues.project_name) {
        const project = compounds.find((item) =>
          valuesMatch(item.en_name, filterValues.project_name)
        );
        labels.push(
          project
            ? locale === "ar"
              ? project.ar_name
              : project.en_name || filterValues.project_name
            : filterValues.project_name
        );
      }

      if (filterValues.purpose) {
        labels.push(t.unitsFilter.purposes[filterValues.purpose] || filterValues.purpose);
      }

      if (filterValues.property_type) {
        const type = BUILDING_TYPES.find((item) =>
          valuesMatch(item.value, filterValues.property_type)
        );
        if (type) {
          const key = String(type.value).toLowerCase();
          labels.push(
            translate(`buildingTypes.${key}`) ||
              (locale === "ar" ? type.ar_label : type.en_label) ||
              type.value
          );
        } else {
          labels.push(filterValues.property_type);
        }
      }

      if (filterValues.furnished_type) {
        const type = FURNISHING_TYPES.find((item) =>
          valuesMatch(item.value, filterValues.furnished_type)
        );
        if (type) {
          const key = String(type.value).toLowerCase();
          const translationKeys = {
            furnished: "property.furnishing.furnished",
            unfurnished: "property.furnishing.unfurnished",
            hotel_furnished: "property.furnishing.hotelFurnished",
            "partially furnished": "property.furnishing.partiallyFurnished",
            "semi furnished": "property.furnishing.semiFurnished",
            flixy: "property.furnishing.flixy",
            turnkey: "property.furnishing.turnkey",
          };
          labels.push(
            translate(translationKeys[key]) ||
              (locale === "ar" ? type.ar_label : type.en_label) ||
              type.value
          );
        } else {
          labels.push(filterValues.furnished_type);
        }
      }

      if (filterValues.min_price || filterValues.max_price) {
        const min = filterValues.min_price ? formatPriceInput(filterValues.min_price) : "";
        const max = filterValues.max_price ? formatPriceInput(filterValues.max_price) : "";
        if (min && max) labels.push(`${min} - ${max} EGP`);
        else if (min) labels.push(`${t.unitsFilter.from || "From"} ${min} EGP`);
        else if (max) labels.push(`${t.unitsFilter.upTo || "Up to"} ${max} EGP`);
      }

      if (filterValues.city) {
        labels.push(cityLabels[filterValues.city] || filterValues.city);
      }
      if (filterValues.district) {
        labels.push(districtLabels[filterValues.district] || filterValues.district);
      }
      if (filterValues.sub_district) {
        labels.push(
          subDistrictLabels[filterValues.sub_district] || filterValues.sub_district
        );
      }

      return labels;
    },
    [
      BUILDING_TYPES,
      FURNISHING_TYPES,
      cityLabels,
      compounds,
      developers,
      districtLabels,
      locale,
      subDistrictLabels,
      t,
      translate,
    ]
  );


  const draftFilterLabels = useMemo(
    () => buildSummaryLabelsFromFilters(draftFilters),
    [buildSummaryLabelsFromFilters, draftFilters]
  );

  return (
    <div className="p-4 space-y-3 bg-white rounded-lg shadow-md">
      {/* Actions */}
      {!isPublic && (
        <div className="w-full space-y-2 pb-3 border-b border-[#E6E6E6]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadDialogOpen(true)}
              className="min-w-0 flex-1 px-3 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              <FileSpreadsheet size={16} className="shrink-0" />
              <span className="whitespace-nowrap text-xs truncate">
                {t.uploadExcel?.button || "Upload"}
              </span>
            </button>
            <AddUnitButton />
            {showBulkToolbar && bulkSelection.hasSelection && (
              <button
                type="button"
                onClick={handleOpenCheckAvailability}
                className="flex items-center justify-center gap-1.5 px-3 h-10 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0"
                title={translate(
                  "unitsFilter.bulkAvailability.checkButton",
                  "Send Message"
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
              </button>
            )}
          </div>

          {showBulkToolbar && (
            <label className="flex w-full items-center gap-2 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary shrink-0"
                checked={bulkSelection.allSelectableVisibleSelected}
                disabled={bulkSelection.selectableVisibleCount === 0}
                onChange={() => bulkSelection.toggleSelectAllVisible()}
              />
              <span className="text-xs truncate">
                {translate(
                  "unitsFilter.bulkAvailability.selectAll",
                  "Select all on page"
                )}
              </span>
              {bulkSelection.hasSelection && (
                <span className="ms-auto text-xs text-gray-500 shrink-0">
                  {translate(
                    "unitsFilter.bulkAvailability.selectedUnits",
                    "{count} selected"
                  ).replace("{count}", String(bulkSelection.selectedUnitIds.size))}
                </span>
              )}
            </label>
          )}
        </div>
      )}

      {/* Filters */}
      <UnitsFavoriteSearches
        filters={draftFilters}
        activeFilterLabels={draftFilterLabels}
        getSummaryLabels={buildSummaryLabelsFromFilters}
        onApply={applyFavoriteSearch}
        isPublic={isPublic}
      />

      <form onSubmit={handleApplyFiltersSubmit} className="space-y-3">
        {/* City */}
        <div className="w-full min-w-0">
          <SearchableCitySelect
            value={draftFilters.city === "all" ? "" : draftFilters.city}
            onChange={(e) => {
              const cityValue = e.target.value || "all";
              handleFilterChange("city", cityValue);
            }}
            name="city"
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allCities", "All Cities")}
            placeholder={translate("unitsFilter.allCities", "All Cities")}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* District */}
        <div className="w-full min-w-0">
          <SearchableDistrictSelect
            value={draftFilters.district === "all" ? "" : draftFilters.district}
            onChange={(e) => {
              const districtValue = e.target.value || "all";
              handleFilterChange("district", districtValue);
            }}
            name="district"
            city={draftFilters.city && draftFilters.city !== "all" ? draftFilters.city : ""}
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allDistricts", "All Districts")}
            placeholder={translate("unitsFilter.allDistricts", "All Districts")}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* Sub-district */}
        <div className="w-full min-w-0">
          <SearchableSubDistrictSelect
            value={draftFilters.sub_district === "all" ? "" : draftFilters.sub_district}
            onChange={(e) => {
              const subValue = e.target.value || "all";
              handleFilterChange("sub_district", subValue);
            }}
            name="sub_district"
            city={draftFilters.city && draftFilters.city !== "all" ? draftFilters.city : ""}
            district={
              draftFilters.district && draftFilters.district !== "all"
                ? draftFilters.district
                : ""
            }
            disabled={
              !draftFilters.city ||
              draftFilters.city === "all" ||
              !draftFilters.district ||
              draftFilters.district === "all"
            }
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allSubDistricts", "All Sub-districts")}
            placeholder={translate("unitsFilter.allSubDistricts", "All Sub-districts")}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* Project */}
        <div className="w-full min-w-0">
          <SearchableProjectSelect
            value={draftFilters.project_name === "all" ? "" : draftFilters.project_name}
            onChange={(e) => {
              const projectValue = e.target.value || "all";
              handleFilterChange("project_name", projectValue);
            }}
            name="project_name"
            projects={compounds}
            city={draftFilters.city && draftFilters.city !== "all" ? draftFilters.city : ""}
            district={
              draftFilters.district && draftFilters.district !== "all"
                ? draftFilters.district
                : ""
            }
            isPublic={isPublic}
            isLoading={projectsLoading}
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allCompounds", "All Projects")}
            placeholder={translate("unitsFilter.allCompounds", "All Projects")}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* Property Type */}
        <div className="w-full min-w-0">
          <SearchablePropertyTypeSelect
            value={draftFilters.property_type === "all" ? "" : draftFilters.property_type}
            onChange={(e) => {
              const propertyTypeValue = e.target.value || "all";
              handleFilterChange("property_type", propertyTypeValue);
            }}
            name="property_type"
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allPropertyTypes", "All Property Types")}
            placeholder={translate("unitsFilter.allPropertyTypes", "All Property Types")}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* Furnishing Type */}
        <div className="w-full min-w-0">
          <SearchableFurnishingTypeSelect
            value={draftFilters.furnished_type === "all" ? "" : draftFilters.furnished_type}
            onChange={(e) => {
              const furnishedTypeValue = e.target.value || "all";
              handleFilterChange("furnished_type", furnishedTypeValue);
            }}
            name="furnished_type"
            showAllOption={true}
            allOptionLabel={translate("unitsFilter.allFurnishingTypes", "All Furnishing Types")}
            placeholder={translate("unitsFilter.allFurnishingTypes", "All Furnishing Types")}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* Purpose */}
        <div className="w-full min-w-0">
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
              const isSelected = draftFilters.purpose === option.value;

              return (
                <label
                  key={option.value}
                  onClick={(e) => {
                    if (isSelected) {
                      e.preventDefault();
                      handleFilterChange("purpose", "all");
                    }
                  }}
                  className={`flex flex-1 min-w-0 items-center gap-2 h-10 px-3 rounded-md border text-xs font-medium cursor-pointer select-none transition-colors ${
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
                  <span className="truncate">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* My Inventory */}
        <div className="w-full min-w-0">
          <label
            className={`flex w-full items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium select-none ${
              draftFilters.my_inventory
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
            } ${!hasClientId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            title={!hasClientId ? (locale === "ar" ? "يتطلب تسجيل الدخول" : "Requires login") : ""}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary shrink-0"
              checked={draftFilters.my_inventory}
              disabled={!hasClientId}
              onChange={(e) => handleFilterChange("my_inventory", e.target.checked)}
            />
            <span className="truncate text-xs">{t.unitsFilter.myInventory}</span>
          </label>
        </div>

        {/* Resale */}
        <div className="w-full min-w-0">
          <label
            className={`flex w-full items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium cursor-pointer select-none ${
              draftFilters.resale
                ? "bg-orange-50 border-orange-300 text-orange-700"
                : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-600 shrink-0"
              checked={draftFilters.resale}
              onChange={(e) => handleFilterChange("resale", e.target.checked)}
            />
            <span className="truncate text-xs">{t.unitsFilter.resale}</span>
          </label>
        </div>

        {/* Price Range */}
        <div className="w-full min-w-0 grid grid-cols-2 gap-2">
          <LenaTextField
            name="min_price"
            type="money"
            label={locale === "ar" ? "الحد الأدنى للسعر" : "Min Price"}
            value={draftFilters.min_price}
            error={priceRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              handleFilterChange("min_price", value);
            }}
            className="w-full min-w-0"
            adornment="EGP"
          />
          <LenaTextField
            name="max_price"
            type="money"
            label={locale === "ar" ? "الحد الأقصى للسعر" : "Max Price"}
            value={draftFilters.max_price}
            error={priceRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              handleFilterChange("max_price", value);
            }}
            className="w-full min-w-0"
            adornment="EGP"
          />
        </div>

        {/* Area Range */}
        <div className="w-full min-w-0 grid grid-cols-2 gap-2">
          <LenaTextField
            name="min_area"
            type="number"
            label={t.unitsFilter.minArea}
            value={draftFilters.min_area}
            error={areaRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              handleFilterChange("min_area", value);
            }}
            className="w-full min-w-0"
            adornment="m²"
          />
          <LenaTextField
            name="max_area"
            type="number"
            label={translate("unitsFilter.maxArea", "Max Area")}
            value={draftFilters.max_area}
            error={areaRangeError}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              handleFilterChange("max_area", value);
            }}
            className="w-full min-w-0"
            adornment="m²"
          />
        </div>

        <button
          type="submit"
          className={`w-full h-11 rounded-md text-sm font-semibold transition-colors shadow-sm ${
            hasPendingChanges
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-primary/80 text-white hover:bg-primary"
          }`}
        >
          {translate("unitsFilter.applyFilters", "Apply Filters")}
        </button>
      </form>

      {/* Active Filters — applied (URL) only */}
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
