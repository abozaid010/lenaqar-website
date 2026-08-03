"use client";

import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useProjectsNames, useDeveloperNames } from "@/hooks/use-admin-shared-data";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { Eye, FileSpreadsheet, Handshake, Loader2, SlidersHorizontal, Trash2, X } from "lucide-react";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchablePropertyTypeSelect from "@/components/ui/inputs/searchable-property-type-select";
import SearchableFurnishingTypeSelect from "@/components/ui/inputs/searchable-furnishing-type-select";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import AuthorFilterSelect from "@/components/ui/inputs/author-filter-select";
import { getFurnishingTypes } from "@/data/constants";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const UploadUnitsExcelDialog = dynamic(
  () => import("./upload-units-excel-dialog"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
      </div>
    ),
  }
);
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useBrokerUnitsBadgeOptional } from "@/context/broker-units-badge-context";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { BULK_AVAILABILITY_DEFAULT_MESSAGE_AR } from "@/lib/units/unit-whatsapp-recipient";
import { detectBrokerUnitIds } from "@/lib/units/detect-broker-units";
import {
  createEmptyFilters,
  normalizeResaleFilter,
  normalizeRentSearchEligibleFilter,
  RENT_SEARCH_ELIGIBLE_AVAILABLE,
  RENT_SEARCH_ELIGIBLE_BOTH,
  RENT_SEARCH_ELIGIBLE_DEFAULT,
  RENT_SEARCH_ELIGIBLE_INELIGIBLE,
  RESALE_FILTER_BOTH,
} from "@/lib/units/favorite-searches";
import { isRentPurpose } from "@/lib/units/unit-price";
import { canViewAllDashboardLeads } from "@/lib/dashboard-lead-access";
import { isHomeyClientId } from "@/lib/dashboard-filters-storage";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  buildUnitsSortOptions,
  decodeUnitsSortValue,
  encodeUnitsSortValue,
  shouldShowPresentValueSortOptions,
  UNITS_PRESENT_VALUE_SORT_FIELDS,
} from "@/lib/units/units-sort";
import { useUnitsFilterDraft } from "@/hooks/use-units-filter-draft";
import {
  resolveAuthorDisplayLabel,
  useTeamAuthorOptions,
} from "@/hooks/useTeamAuthorOptions";
// import UnitsFavoriteSearches from "@/components/ui/units-favorite-searches";

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

  // Labels come from the active locale via i18n (no dual locale import).
  const BUILDING_TYPES = useMemo(() => {
    const slice = { buildingTypes: translate("buildingTypes", {}) };
    return getBuildingTypes({ en: slice, ar: slice });
  }, [translate]);

  const FURNISHING_TYPES = useMemo(() => {
    const slice = {
      unitDetails: { furnishingTypes: t.unitDetails?.furnishingTypes || {} },
    };
    return getFurnishingTypes({ en: slice, ar: slice });
  }, [t]);

  const BEDROOM_OPTIONS = useMemo(
    () =>
      Array.from({ length: 9 }, (_, count) => ({
        value: String(count),
        label:
          count === 0
            ? translate("unitsFilter.studio", "Studio")
            : translate("unitsFilter.bedroomsOption", "{count} bedrooms").replace(
                "{count}",
                String(count)
              ),
      })),
    [translate]
  );

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

  const includePresentValueSorts = shouldShowPresentValueSortOptions(
    draftFilters.purpose
  );

  const SORT_OPTIONS = useMemo(
    () =>
      buildUnitsSortOptions(translate, {
        includePresentValueSorts,
      }),
    [translate, includePresentValueSorts]
  );

  const selectedSortValue = encodeUnitsSortValue(
    draftFilters.sort_by,
    draftFilters.sort_order
  );

  const { authorOptions } = useTeamAuthorOptions({
    selectedAuthor: draftFilters.author || filters.author || "",
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
          const navPathname =
            typeof window !== "undefined" && window.location?.pathname
              ? window.location.pathname
              : pathname;
          router.replace(qs ? `${navPathname}?${qs}` : navPathname, {
            scroll: false,
          });
        }
      } catch (error) {
        console.error("Failed to normalize filter params:", error?.message ?? error);
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
        console.error("Failed to load city labels:", error?.message ?? error);
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
        console.error("Failed to load district labels:", error?.message ?? error);
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
        console.error("Failed to load sub-district labels:", error?.message ?? error);
      }
    };

    loadSubDistrictLabels();
  }, [locale, draftFilters.city, draftFilters.district]);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [isHomeyClient, setIsHomeyClient] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isDetectingBrokers, setIsDetectingBrokers] = useState(false);
  const [brokerDetectProgress, setBrokerDetectProgress] = useState({
    done: 0,
    total: 0,
  });
  const [cityLabels, setCityLabels] = useState({});
  const [districtLabels, setDistrictLabels] = useState({});
  const [subDistrictLabels, setSubDistrictLabels] = useState({});
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const bulkSelection = useUnitsBulkSelectionOptional();
  const brokerBadges = useBrokerUnitsBadgeOptional();

  useEffect(() => {
    setIsMounted(true);
    setIsHomeyClient(isHomeyClientId(LenaCookiesManager.getClientId()));
    setIsAdminUser(canViewAllDashboardLeads());
  }, []);

  /** Homey admin/owner only — same detect behavior as hidden units; never shown to others. */
  const canMarkBrokerUnits =
    !isPublic && isMounted && isHomeyClient && isAdminUser && Boolean(brokerBadges);

  // Lock body scroll while the mobile filter sheet is open
  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileFiltersOpen]);

  // Close mobile sheet when switching to desktop layout
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const onChange = (event) => {
      if (event.matches) setIsMobileFiltersOpen(false);
    };
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
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

  const handleDetectBrokerUnits = useCallback(async () => {
    if (!canMarkBrokerUnits || isDetectingBrokers || !brokerBadges) return;
    const units = bulkSelection?.visibleUnits;
    if (!units?.length) {
      toast.error(
        translate(
          "resalePage.brokerDetect.noUnits",
          "No units to check on this page."
        )
      );
      return;
    }

    setIsDetectingBrokers(true);
    setBrokerDetectProgress({ done: 0, total: 0 });
    try {
      const ids = await detectBrokerUnitIds(units, {
        onProgress: (done, total) => setBrokerDetectProgress({ done, total }),
      });
      brokerBadges.mergeDetectedBrokerIds(ids);
      toast.success(
        translate(
          "resalePage.brokerDetect.done",
          "Found {count} broker unit(s)"
        ).replace("{count}", String(ids.size))
      );
    } catch (error) {
      console.error("Broker detect failed:", error?.message ?? error);
      toast.error(
        translate(
          "resalePage.brokerDetect.failed",
          "Failed to check broker owners. Please try again."
        )
      );
    } finally {
      setIsDetectingBrokers(false);
    }
  }, [
    canMarkBrokerUnits,
    isDetectingBrokers,
    brokerBadges,
    bulkSelection?.visibleUnits,
    translate,
  ]);

  const brokerDetectButton =
    canMarkBrokerUnits ? (
      <button
        type="button"
        onClick={handleDetectBrokerUnits}
        disabled={
          isDetectingBrokers || !(bulkSelection?.visibleUnits?.length > 0)
        }
        className="shrink-0 flex h-10 w-10 min-h-11 min-w-11 lg:min-h-10 lg:min-w-10 items-center justify-center rounded-md border border-amber-300 bg-amber-50 text-amber-900 shadow-sm hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        title={translate(
          "resalePage.brokerDetect.hint",
          "Look up owner type via quick-search and badge broker units"
        )}
        aria-label={translate(
          "resalePage.brokerDetect.button",
          "Mark broker units"
        )}
      >
        {isDetectingBrokers ? (
          <span className="text-[10px] font-semibold tabular-nums leading-none">
            {brokerDetectProgress.total > 0
              ? `${brokerDetectProgress.done}/${brokerDetectProgress.total}`
              : "…"}
          </span>
        ) : (
          <Handshake size={18} aria-hidden />
        )}
      </button>
    ) : null;

  const buildActiveFilters = useCallback((nextFilters) => {
    const list = [];
    if (nextFilters.sort_by && nextFilters.sort_order) {
      const sortValue = encodeUnitsSortValue(
        nextFilters.sort_by,
        nextFilters.sort_order
      );
      const sortLabel =
        buildUnitsSortOptions(translate, {
          includePresentValueSorts: shouldShowPresentValueSortOptions(
            nextFilters.purpose
          ),
        }).find((opt) => opt.value === sortValue)?.label || sortValue;
      list.push({
        key: "sort",
        value: sortLabel,
      });
    }
    if (nextFilters.author) {
      list.push({
        key: "author",
        value: resolveAuthorDisplayLabel(nextFilters.author, authorOptions),
      });
    }
    if (nextFilters.my_inventory) {
      list.push({ key: "my_inventory", value: t.unitsFilter.myInventory });
    }
    {
      const resaleValue = normalizeResaleFilter(nextFilters.resale);
      if (
        String(nextFilters.purpose || "").toLowerCase() === "sell" &&
        resaleValue === "primary"
      ) {
        list.push({
          key: "resale",
          value: translate("unitsFilter.inventoryTypes.primary", "Primary"),
        });
      } else if (
        String(nextFilters.purpose || "").toLowerCase() === "sell" &&
        resaleValue === "resale"
      ) {
        list.push({
          key: "resale",
          value: translate("unitsFilter.inventoryTypes.resale", "Resale"),
        });
      }
    }
    {
      if (isRentPurpose(nextFilters.purpose)) {
        const eligible = normalizeRentSearchEligibleFilter(
          nextFilters.rentSearchEligible || RENT_SEARCH_ELIGIBLE_DEFAULT
        );
        if (eligible === RENT_SEARCH_ELIGIBLE_INELIGIBLE) {
          list.push({
            key: "rentSearchEligible",
            value: translate(
              "unitsFilter.rentSearchEligibleOptions.notAvailable",
              "Not available"
            ),
          });
        } else if (eligible === RENT_SEARCH_ELIGIBLE_BOTH) {
          list.push({
            key: "rentSearchEligible",
            value: translate(
              "unitsFilter.rentSearchEligibleOptions.both",
              "Both"
            ),
          });
        }
      }
    }
    if (nextFilters.show_present_value) {
      list.push({
        key: "show_present_value",
        value: translate(
          "unitsFilter.showPresentValue",
          "Show present value"
        ),
      });
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
    if (nextFilters.bedrooms !== "" && nextFilters.bedrooms != null) {
      list.push({
        key: "bedrooms",
        value: getSelectedBedrooms(nextFilters.bedrooms),
      });
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
    if (nextFilters.city || nextFilters.district || nextFilters.sub_district) {
      list.push({
        key: "location",
        value: getSelectedLocation(nextFilters),
      });
    }
    return list;
  }, [
    locale,
    t,
    translate,
    compounds,
    developers,
    cityLabels,
    districtLabels,
    subDistrictLabels,
    filters.city,
    filters.district,
    authorOptions,
    BEDROOM_OPTIONS,
  ]);

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

  const handleLocationChange = (payload) => {
    updateDraftFilters((prev) => {
      const nextCity = payload?.city
        ? String(payload.city).toLowerCase().trim()
        : "";
      const nextDistrict = payload?.district
        ? String(payload.district).toLowerCase().trim()
        : "";
      const nextSubDistrict = payload?.sub_district
        ? String(payload.sub_district).toLowerCase().trim()
        : "";
      const cityChanged = nextCity !== (prev.city || "");
      const districtChanged = nextDistrict !== (prev.district || "");

      return {
        ...prev,
        city: nextCity,
        district: nextDistrict,
        sub_district: nextSubDistrict,
        // Match prior cascade: city/district changes reset project scope
        project_name:
          cityChanged || districtChanged ? "" : prev.project_name || "",
      };
    });
  };

  const handleFilterChange = (key, value) => {
    updateDraftFilters((prev) => {
      const next = { ...prev };

      if (key === "my_inventory" || key === "show_present_value") {
        next[key] = Boolean(value);
      } else if (key === "resale") {
        next.resale = normalizeResaleFilter(value);
      } else if (key === "rentSearchEligible") {
        next.rentSearchEligible = normalizeRentSearchEligibleFilter(value);
      } else if (
        key === "min_area" ||
        key === "max_area" ||
        key === "min_price" ||
        key === "max_price"
      ) {
        next[key] = value == null ? "" : String(value);
      } else if (key === "purpose") {
        const nextPurpose =
          value && value !== "" && value !== "all" ? value : "";
        next.purpose = nextPurpose;
        if (isRentPurpose(nextPurpose)) {
          next.rentSearchEligible =
            next.rentSearchEligible &&
            [RENT_SEARCH_ELIGIBLE_AVAILABLE, RENT_SEARCH_ELIGIBLE_INELIGIBLE, RENT_SEARCH_ELIGIBLE_BOTH].includes(
              String(next.rentSearchEligible)
            )
              ? normalizeRentSearchEligibleFilter(next.rentSearchEligible)
              : RENT_SEARCH_ELIGIBLE_DEFAULT;
          next.resale = RESALE_FILTER_BOTH;
        } else if (String(nextPurpose).toLowerCase() === "sell") {
          next.rentSearchEligible = "";
        } else {
          next.rentSearchEligible = "";
          next.resale = RESALE_FILTER_BOTH;
        }
        // Drop PV sorts when switching to rent — API nulls PV for rent.
        if (
          !shouldShowPresentValueSortOptions(nextPurpose) &&
          UNITS_PRESENT_VALUE_SORT_FIELDS.includes(next.sort_by)
        ) {
          next.sort_by = "";
          next.sort_order = "";
        }
      } else if (value && value !== "" && value !== "all") {
        let normalizedValue = value;

        if (key === "project_name") {
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
        } else if (key === "bedrooms") {
          const digits = String(value).replace(/\D/g, "");
          normalizedValue = digits;
        }

        next[key] = normalizedValue;
      } else {
        next[key] = "";
      }

      return next;
    });
  };

  /** Sort applies immediately — no debounce wait. */
  const handleSortChange = (combinedValue) => {
    const { sort_by, sort_order } = decodeUnitsSortValue(combinedValue);
    applyExternalFilters({
      ...draftFilters,
      sort_by,
      sort_order,
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
    setIsMobileFiltersOpen(false);
  };

  const handleClearAllAndCloseMobile = () => {
    handleRemoveAllFilters();
    setIsMobileFiltersOpen(false);
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

  function getSelectedLocation(filterValues = filters) {
    const parts = [];
    if (filterValues.city && filterValues.city !== "all") {
      parts.push(cityLabels[filterValues.city] || filterValues.city);
    }
    if (filterValues.district && filterValues.district !== "all") {
      parts.push(districtLabels[filterValues.district] || filterValues.district);
    }
    if (filterValues.sub_district && filterValues.sub_district !== "all") {
      parts.push(
        subDistrictLabels[filterValues.sub_district] || filterValues.sub_district
      );
    }
    return parts.join(" › ");
  }

  function getSelectedBedrooms(raw = filters.bedrooms) {
    if (raw === "" || raw == null || raw === "all") {
      return translate("unitsFilter.allBedrooms", "All Bedrooms");
    }
    const match = BEDROOM_OPTIONS.find((opt) => String(opt.value) === String(raw));
    return match?.label || String(raw);
  }

  function getFilterDisplayText(key, value) {
    switch (key) {
      case "sort":
        return value;
      case "author":
        return resolveAuthorDisplayLabel(value, authorOptions) || value;
      case "my_inventory":
        return t.unitsFilter.myInventory;
      case "resale": {
        const resaleValue = normalizeResaleFilter(value || filters.resale);
        if (resaleValue === "primary") {
          return translate("unitsFilter.inventoryTypes.primary", "Primary");
        }
        if (resaleValue === "resale") {
          return translate("unitsFilter.inventoryTypes.resale", "Resale");
        }
        return translate("unitsFilter.inventoryTypes.both", "Both");
      }
      case "rentSearchEligible": {
        const eligible = normalizeRentSearchEligibleFilter(
          value || filters.rentSearchEligible || RENT_SEARCH_ELIGIBLE_DEFAULT
        );
        if (eligible === RENT_SEARCH_ELIGIBLE_INELIGIBLE) {
          return translate(
            "unitsFilter.rentSearchEligibleOptions.notAvailable",
            "Not available"
          );
        }
        if (eligible === RENT_SEARCH_ELIGIBLE_BOTH) {
          return translate(
            "unitsFilter.rentSearchEligibleOptions.both",
            "Both"
          );
        }
        return translate(
          "unitsFilter.rentSearchEligibleOptions.available",
          "Available"
        );
      }
      case "show_present_value":
        return translate(
          "unitsFilter.showPresentValue",
          "Show present value"
        );
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
      case "bedrooms":
        return value || getSelectedBedrooms();
      case "location":
      case "city":
      case "district":
      case "sub_district":
        return value || getSelectedLocation();
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

      if (filterValues.sort_by && filterValues.sort_order) {
        const sortValue = encodeUnitsSortValue(
          filterValues.sort_by,
          filterValues.sort_order
        );
        const sortLabel = SORT_OPTIONS.find((opt) => opt.value === sortValue)?.label;
        if (sortLabel) labels.push(sortLabel);
      }

      if (filterValues.author) {
        labels.push(
          resolveAuthorDisplayLabel(filterValues.author, authorOptions) ||
            filterValues.author,
        );
      }
      if (filterValues.my_inventory) labels.push(t.unitsFilter.myInventory);
      {
        const resaleValue = normalizeResaleFilter(filterValues.resale);
        if (String(filterValues.purpose || "").toLowerCase() === "sell") {
          if (resaleValue === "primary") {
            labels.push(translate("unitsFilter.inventoryTypes.primary", "Primary"));
          } else if (resaleValue === "resale") {
            labels.push(translate("unitsFilter.inventoryTypes.resale", "Resale"));
          }
        }
      }
      if (isRentPurpose(filterValues.purpose)) {
        const eligible = normalizeRentSearchEligibleFilter(
          filterValues.rentSearchEligible || RENT_SEARCH_ELIGIBLE_DEFAULT
        );
        if (eligible === RENT_SEARCH_ELIGIBLE_INELIGIBLE) {
          labels.push(
            translate(
              "unitsFilter.rentSearchEligibleOptions.notAvailable",
              "Not available"
            )
          );
        } else if (eligible === RENT_SEARCH_ELIGIBLE_BOTH) {
          labels.push(
            translate("unitsFilter.rentSearchEligibleOptions.both", "Both")
          );
        }
      }
      if (filterValues.show_present_value) {
        labels.push(
          translate("unitsFilter.showPresentValue", "Show present value")
        );
      }

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

      if (filterValues.bedrooms !== "" && filterValues.bedrooms != null) {
        labels.push(getSelectedBedrooms(filterValues.bedrooms));
      }

      if (filterValues.min_price || filterValues.max_price) {
        const min = filterValues.min_price ? formatPriceInput(filterValues.min_price) : "";
        const max = filterValues.max_price ? formatPriceInput(filterValues.max_price) : "";
        if (min && max) labels.push(`${min} - ${max} EGP`);
        else if (min) labels.push(`${t.unitsFilter.from || "From"} ${min} EGP`);
        else if (max) labels.push(`${t.unitsFilter.upTo || "Up to"} ${max} EGP`);
      }

      if (
        filterValues.city ||
        filterValues.district ||
        filterValues.sub_district
      ) {
        const parts = [];
        if (filterValues.city && filterValues.city !== "all") {
          parts.push(cityLabels[filterValues.city] || filterValues.city);
        }
        if (filterValues.district && filterValues.district !== "all") {
          parts.push(
            districtLabels[filterValues.district] || filterValues.district
          );
        }
        if (filterValues.sub_district && filterValues.sub_district !== "all") {
          parts.push(
            subDistrictLabels[filterValues.sub_district] ||
              filterValues.sub_district
          );
        }
        if (parts.length > 0) labels.push(parts.join(" › "));
      }

      return labels;
    },
    [
      BUILDING_TYPES,
      FURNISHING_TYPES,
      BEDROOM_OPTIONS,
      SORT_OPTIONS,
      authorOptions,
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

  const activeFilterCount = activeFilters.length;
  const filtersLabel = translate("unitsFilter.filters", "Filters");

  const activeFiltersChips = activeFilterCount > 0 && (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeFilters.map((filter, index) => (
          <div
            key={`${filter.key}-${index}`}
            className="flex items-center gap-1.5 bg-gray-100 rounded-full ps-2.5 pe-1 py-1 text-sm text-gray-700 shrink-0 max-w-[200px]"
          >
            <p className="truncate text-xs">
              {getFilterDisplayText(filter.key, filter.value)}
            </p>
            <button
              type="button"
              className="shrink-0 flex items-center justify-center min-h-10 min-w-10 lg:min-h-8 lg:min-w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              aria-label={translate("unitsFilter.clearall", "Clear")}
              onClick={() => {
                if (filter.removeKeys) {
                  filter.removeKeys.forEach((key) => handleRemoveFilter(key));
                } else {
                  handleRemoveFilter(filter.key);
                }
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="shrink-0 flex items-center gap-1.5 min-h-10 lg:min-h-9 px-2.5 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        onClick={handleRemoveAllFilters}
      >
        <Trash2 size={14} />
        <span className="hidden xs:inline sm:inline">
          {t.unitsFilter.clearall}
        </span>
      </button>
    </div>
  );

  const actionsBlock = !isPublic && (
    <div className="w-full pb-3 border-b border-[#E6E6E6]">
      <div className="flex items-center gap-2 min-w-0">
        <AddUnitButton />
        <button
          type="button"
          onClick={() => setIsUploadDialogOpen(true)}
          className="shrink-0 px-3 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
          aria-label={t.uploadExcel?.button || "Upload"}
          title={t.uploadExcel?.button || "Upload"}
        >
          <FileSpreadsheet size={16} className="shrink-0" />
        </button>
        <button
          type="button"
          onClick={() =>
            applyExternalFilters({
              ...draftFilters,
              show_present_value: !draftFilters.show_present_value,
            })
          }
          className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-md border transition-colors shadow-sm ${
            draftFilters.show_present_value
              ? "border-primary bg-primary text-white"
              : "border-gray-300 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
          }`}
          aria-label={translate(
            "unitsFilter.showPresentValue",
            "Show present value"
          )}
          title={translate(
            "unitsFilter.showPresentValue",
            "Show present value"
          )}
          aria-pressed={Boolean(draftFilters.show_present_value)}
        >
          <Eye size={18} aria-hidden />
        </button>
        {brokerDetectButton}
        {showBulkToolbar && (
          <label className="flex min-w-0 flex-1 items-center gap-1.5 h-10 px-2 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
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
                "select all"
              )}
            </span>
            {bulkSelection.hasSelection && (
              <span className="ms-auto text-[10px] text-gray-500 shrink-0 tabular-nums">
                {bulkSelection.selectedUnitIds.size}
              </span>
            )}
          </label>
        )}
        {showBulkToolbar && bulkSelection.hasSelection && (
          <button
            type="button"
            onClick={handleOpenCheckAvailability}
            className="flex items-center justify-center gap-1.5 px-2.5 h-10 min-w-10 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0"
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
    </div>
  );

  const filterFields = (
    <>
      {/* Favorite Searches — hidden for now
      <UnitsFavoriteSearches
        filters={draftFilters}
        activeFilterLabels={draftFilterLabels}
        getSummaryLabels={buildSummaryLabelsFromFilters}
        onApply={(savedFilters) => {
          applyFavoriteSearch(savedFilters);
          setIsMobileFiltersOpen(false);
        }}
        isPublic={isPublic}
      />
      */}

      <form onSubmit={handleApplyFiltersSubmit} className="space-y-3" id="units-filter-form">
        <div className="w-full min-w-0">
          <UnitsLocationSearch
            city={draftFilters.city === "all" ? "" : draftFilters.city}
            district={
              draftFilters.district === "all" ? "" : draftFilters.district
            }
            subDistrict={
              draftFilters.sub_district === "all"
                ? ""
                : draftFilters.sub_district
            }
            onChange={handleLocationChange}
            buttonClassName={filterButtonClassName}
          />
        </div>

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

        <div className="w-full min-w-0">
          <SearchableDropdownSelect
            name="bedrooms"
            options={BEDROOM_OPTIONS}
            value={
              draftFilters.bedrooms === "all" || draftFilters.bedrooms == null
                ? ""
                : String(draftFilters.bedrooms)
            }
            onChange={(e) => {
              handleFilterChange("bedrooms", e.target.value || "all");
            }}
            showAllOption
            allOptionLabel={translate("unitsFilter.allBedrooms", "All Bedrooms")}
            placeholder={translate("unitsFilter.allBedrooms", "All Bedrooms")}
            searchPlaceholder={translate(
              "unitsFilter.bedroomsSearchPlaceholder",
              "Search bedrooms…"
            )}
            noResultsText={translate(
              "unitsFilter.bedroomsSearchEmpty",
              "No matching bedrooms"
            )}
            getValue={(opt) => opt.value}
            getLabel={(opt) => opt.label}
            buttonClassName={filterButtonClassName}
          />
        </div>

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

        {!isPublic && (
          <div className="w-full min-w-0">
            <AuthorFilterSelect
              name="units_author"
              value={draftFilters.author || ""}
              onChange={(e) => handleFilterChange("author", e?.target?.value || "")}
              buttonClassName={filterButtonClassName}
            />
          </div>
        )}

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

        {String(draftFilters.purpose || "").toLowerCase() === "sell" && (
          <div className="w-full min-w-0">
            <p className="text-xs font-medium text-[#494A4B] mb-1.5">
              {translate("unitsFilter.inventoryType", "Inventory")}
            </p>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={translate("unitsFilter.inventoryType", "Inventory")}
            >
              {[
                {
                  value: "primary",
                  label: translate("unitsFilter.inventoryTypes.primary", "Primary"),
                },
                {
                  value: "resale",
                  label: translate("unitsFilter.inventoryTypes.resale", "Resale"),
                },
                {
                  value: "",
                  label: translate("unitsFilter.inventoryTypes.both", "Both"),
                },
              ].map((option) => {
                const current = normalizeResaleFilter(draftFilters.resale);
                const isSelected =
                  option.value === ""
                    ? current === ""
                    : current === option.value;

                return (
                  <label
                    key={option.value || "both"}
                    className={`flex flex-1 min-w-0 items-center gap-2 h-10 px-3 rounded-md border text-xs font-medium cursor-pointer select-none transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resale"
                      value={option.value || "both"}
                      checked={isSelected}
                      onChange={() => handleFilterChange("resale", option.value)}
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {isRentPurpose(draftFilters.purpose) && (
          <div className="w-full min-w-0">
            <p className="text-xs font-medium text-[#494A4B] mb-1.5">
              {translate(
                "unitsFilter.rentSearchEligible",
                "Rent availability"
              )}
            </p>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={translate(
                "unitsFilter.rentSearchEligible",
                "Rent availability"
              )}
            >
              {[
                {
                  value: RENT_SEARCH_ELIGIBLE_AVAILABLE,
                  label: translate(
                    "unitsFilter.rentSearchEligibleOptions.available",
                    "Available"
                  ),
                },
                {
                  value: RENT_SEARCH_ELIGIBLE_INELIGIBLE,
                  label: translate(
                    "unitsFilter.rentSearchEligibleOptions.notAvailable",
                    "Not available"
                  ),
                },
                {
                  value: RENT_SEARCH_ELIGIBLE_BOTH,
                  label: translate(
                    "unitsFilter.rentSearchEligibleOptions.both",
                    "Both"
                  ),
                },
              ].map((option) => {
                const current = normalizeRentSearchEligibleFilter(
                  draftFilters.rentSearchEligible || RENT_SEARCH_ELIGIBLE_DEFAULT
                );
                const isSelected = current === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex flex-1 min-w-0 items-center gap-2 h-10 px-3 rounded-md border text-xs font-medium cursor-pointer select-none transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rentSearchEligible"
                      value={option.value}
                      checked={isSelected}
                      onChange={() =>
                        handleFilterChange("rentSearchEligible", option.value)
                      }
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

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

        <div className="w-full min-w-0">
          <p className="text-xs font-medium text-[#494A4B] mb-1.5">
            {translate("unitsFilter.sort.label", "Sort by")}
          </p>
          <SearchableDropdownSelect
            name="units_sort"
            options={SORT_OPTIONS.filter((opt) => opt.value !== "")}
            value={selectedSortValue}
            onChange={(e) => handleSortChange(e.target.value || "")}
            showAllOption
            allOptionLabel={translate("unitsFilter.sort.default", "Default")}
            placeholder={translate("unitsFilter.sort.label", "Sort by")}
            searchPlaceholder={translate(
              "unitsFilter.sort.searchPlaceholder",
              "Search sort options…"
            )}
            noResultsText={translate(
              "unitsFilter.sort.searchEmpty",
              "No matching sort options"
            )}
            getValue={(opt) => opt.value}
            getLabel={(opt) => opt.label}
            buttonClassName={filterButtonClassName}
          />
        </div>

        {/* Desktop apply — mobile uses sticky sheet footer */}
        <button
          type="submit"
          className={`hidden lg:flex w-full h-11 items-center justify-center rounded-md text-sm font-semibold transition-colors shadow-sm ${
            hasPendingChanges
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-primary/80 text-white hover:bg-primary"
          }`}
        >
          {translate("unitsFilter.applyFilters", "Apply Filters")}
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* Mobile toolbar: filters trigger + primary actions */}
      <div className={`lg:hidden space-y-2 min-w-0 ${isMobileFiltersOpen ? "invisible pointer-events-none" : ""}`}>
        <div className="sticky top-12 z-20 lg:top-0 -mx-1 px-1 py-1 bg-[#E2DBFF]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[#E2DBFF]/80">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="relative flex items-center justify-center gap-2 min-h-11 flex-1 min-w-0 px-3 rounded-md bg-white border border-[#E6E6E6] text-[#494A4B] text-sm font-medium shadow-sm hover:border-primary/40"
              aria-label={translate("unitsFilter.openFilters", "Open filters")}
            >
              <SlidersHorizontal size={18} className="shrink-0 text-primary" />
              <span className="truncate">{filtersLabel}</span>
              {activeFilterCount > 0 && (
                <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
              {hasPendingChanges && (
                <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-orange-500" aria-hidden />
              )}
            </button>

            {!isPublic && (
              <>
                <button
                  type="button"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="shrink-0 flex items-center justify-center min-h-11 min-w-11 px-2.5 rounded-md bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  aria-label={t.uploadExcel?.button || "Upload"}
                  title={t.uploadExcel?.button || "Upload"}
                >
                  <FileSpreadsheet size={18} />
                </button>
                <AddUnitButton />
                <button
                  type="button"
                  onClick={() =>
                    applyExternalFilters({
                      ...draftFilters,
                      show_present_value: !draftFilters.show_present_value,
                    })
                  }
                  className={`shrink-0 flex min-h-11 min-w-11 items-center justify-center rounded-md border shadow-sm transition-colors ${
                    draftFilters.show_present_value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                  }`}
                  aria-label={translate(
                    "unitsFilter.showPresentValue",
                    "Show present value"
                  )}
                  title={translate(
                    "unitsFilter.showPresentValue",
                    "Show present value"
                  )}
                  aria-pressed={Boolean(draftFilters.show_present_value)}
                >
                  <Eye size={19} aria-hidden />
                </button>
                {brokerDetectButton}
                {showBulkToolbar && bulkSelection.hasSelection && (
                  <button
                    type="button"
                    onClick={handleOpenCheckAvailability}
                    className="shrink-0 flex items-center justify-center min-h-11 min-w-11 px-2.5 rounded-md bg-white border border-gray-300 text-gray-800 shadow-sm"
                    title={translate(
                      "unitsFilter.bulkAvailability.checkButton",
                      "Send Message"
                    )}
                    aria-label={translate(
                      "unitsFilter.bulkAvailability.checkButton",
                      "Send Message"
                    )}
                  >
                    <svg
                      className="w-5 h-5 text-green-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {showBulkToolbar && (
            <label className="mt-2 flex w-full items-center gap-2 min-h-10 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none">
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
                  "select all"
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

        {activeFiltersChips}
      </div>

      {/* Mobile sheet — portaled to body so it is not trapped by sticky/overflow ancestors */}
      {isMounted &&
        isMobileFiltersOpen &&
        createPortal(
          <div className="lg:hidden">
            <button
              type="button"
              className="fixed inset-0 z-[55] bg-black/50"
              aria-label={translate("unitsFilter.closeFilters", "Close filters")}
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(92dvh,100%)] flex-col rounded-t-2xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label={filtersLabel}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {filtersLabel}
                  </h2>
                  {activeFilterCount > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      {translate("unitsFilter.filtersCount", "{count} filters").replace(
                        "{count}",
                        String(activeFilterCount)
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="shrink-0 flex items-center justify-center min-h-10 min-w-10 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={translate("unitsFilter.closeFilters", "Close filters")}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                {filterFields}
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
                <button
                  type="button"
                  onClick={handleClearAllAndCloseMobile}
                  className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 truncate px-2"
                >
                  {t.unitsFilter.clearall}
                </button>
                <button
                  type="submit"
                  form="units-filter-form"
                  className={`min-h-11 flex-[1.4] rounded-md text-sm font-semibold shadow-sm truncate px-2 ${
                    hasPendingChanges
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-primary/80 text-white hover:bg-primary"
                  }`}
                >
                  {translate("unitsFilter.applyFilters", "Apply Filters")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Desktop sidebar panel — owns the form when the mobile sheet is closed */}
      {!isMobileFiltersOpen && (
        <div className="hidden lg:block bg-white rounded-lg shadow-md">
          <div className="p-4 space-y-3">
            {actionsBlock}
            {filterFields}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">
                  {t.unitsFilter.activeFilter}
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={`desktop-${filter.key}-${index}`}
                      className="flex items-center gap-3 bg-gray-100 rounded px-1.5 py-1 text-sm text-gray-700"
                    >
                      <p className="truncate max-w-[180px] text-xs">
                        {getFilterDisplayText(filter.key, filter.value)}
                      </p>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 min-h-8 min-w-8 inline-flex items-center justify-center"
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
        </div>
      )}

      {isUploadDialogOpen && (
        <UploadUnitsExcelDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
        />
      )}

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
    </>
  );

}
