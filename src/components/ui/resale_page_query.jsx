"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import UnitCodeSearch from "@/components/ui/unit-code-search";
import { usePendingApprovalUnitsPageData } from "@/hooks/use-pending-approval-units-page-data";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import AuthorFilterSelect from "@/components/ui/inputs/author-filter-select";
import { unitsSourcePendingQueryString } from "@/utils/units-navigation-source";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { BULK_AVAILABILITY_DEFAULT_MESSAGE_AR } from "@/lib/units/unit-whatsapp-recipient";
import {
  resolveAuthorDisplayLabel,
  useTeamAuthorOptions,
} from "@/hooks/useTeamAuthorOptions";
import {
  canViewAllDashboardLeads,
  enforceDashboardAuthorOnParams,
  getDashboardLoggedInEmail,
} from "@/lib/dashboard-lead-access";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { ChevronDown, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

const DEFAULT_VISIBILITY = "pending_approval";

const FILTER_BUTTON_CLASS =
  "[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-11 [&>div>button]:min-h-11 [&>div>button]:px-2 [&>div>button]:py-[10px]";

const DATE_INPUT_CLASS =
  "w-full px-2 py-[10px] h-11 min-h-11 bg-[#F6F7FB] rounded-[5px] border border-[#E6E6E6] text-[#494A4B] text-base focus:outline-none focus:ring-primary focus:border-primary";

function WhatsAppIcon({ className = "w-4 h-4 text-green-600 shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
    </svg>
  );
}

function formatPriceInput(value) {
  if (!value) return "";
  const numericValue = String(value).replace(/\D/g, "");
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function ResalePageQuery({ searchParams, initialUnitsData = null }) {
  const { t, locale, translate } = useI18n();
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const bulkSelection = useUnitsBulkSelectionOptional();
  const [isMounted, setIsMounted] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const visibilityOptions = useMemo(
    () => [
      {
        value: "pending_approval",
        label: t?.unitsFilter?.pendingApproval ?? "Pending Approval",
      },
      { value: "hidden", label: t?.unitsFilter?.hidden ?? "Hidden" },
    ],
    [t]
  );

  // Applied filters (drive API query) — desktop edits these directly
  const [filter, setFilter] = useState(DEFAULT_VISIBILITY);
  const [updatedAtDate, setUpdatedAtDate] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [author, setAuthor] = useState("");

  // Mobile sheet draft (committed on Apply)
  const [draftFilter, setDraftFilter] = useState(DEFAULT_VISIBILITY);
  const [draftUpdatedAtDate, setDraftUpdatedAtDate] = useState("");
  const [draftPropertyType, setDraftPropertyType] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [draftAuthor, setDraftAuthor] = useState("");

  // Desktop price popover draft
  const [pricePopoverMin, setPricePopoverMin] = useState("");
  const [pricePopoverMax, setPricePopoverMax] = useState("");
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const priceDropdownRef = useRef(null);

  const { authorOptions } = useTeamAuthorOptions({
    selectedAuthor: author || draftAuthor || "",
  });

  // Same author ACL as Leads: non-admin/non-owner forced to own email.
  useEffect(() => {
    const email = getDashboardLoggedInEmail();
    if (canViewAllDashboardLeads() || !email) return;
    setAuthor((prev) => {
      const current = typeof prev === "string" ? prev.trim() : "";
      return current.toLowerCase() === email.toLowerCase() ? prev : email;
    });
    setDraftAuthor((prev) => {
      const current = typeof prev === "string" ? prev.trim() : "";
      return current.toLowerCase() === email.toLowerCase() ? prev : email;
    });
  }, []);

  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  useOnClickOutside(priceDropdownRef, () => setIsPriceDropdownOpen(false));

  const searchParamsKey = useMemo(() => {
    const base = searchParams || {};
    const withFilter = { ...base, visibility: filter || DEFAULT_VISIBILITY };
    const withDate =
      updatedAtDate && updatedAtDate.trim() !== ""
        ? { ...withFilter, updated_at: `${updatedAtDate.trim()}T00:00:00.000Z` }
        : withFilter;
    const withPropertyType =
      propertyType && propertyType.trim() !== ""
        ? { ...withDate, property_type: propertyType.trim() }
        : withDate;
    const withPrice = { ...withPropertyType };
    if (minPrice != null && minPrice !== "") withPrice.min_price = minPrice;
    if (maxPrice != null && maxPrice !== "") withPrice.max_price = maxPrice;
    const authorValue = typeof author === "string" ? author.trim() : "";
    if (authorValue) withPrice.author = authorValue;
    // Defense in depth: query key + fetch always include own author for non-admins.
    return JSON.stringify(enforceDashboardAuthorOnParams(withPrice));
  }, [searchParams, filter, updatedAtDate, propertyType, minPrice, maxPrice, author]);

  const hasActiveClientFilters =
    Boolean(updatedAtDate?.trim()) ||
    Boolean(propertyType?.trim()) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(author?.trim()) ||
    filter !== DEFAULT_VISIBILITY;

  const initialDataForQuery =
    !hasActiveClientFilters && initialUnitsData != null ? initialUnitsData : null;

  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    usePendingApprovalUnitsPageData(searchParamsKey, initialDataForQuery);

  const setVisibleUnitsFromList = bulkSelection?.setVisibleUnitsFromList;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (setVisibleUnitsFromList) {
      setVisibleUnitsFromList(units);
    }
  }, [units, setVisibleUnitsFromList]);

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

  const showBulkToolbar = isMounted && canShowBulkButton && bulkSelection;
  const defaultAvailabilityMessage = BULK_AVAILABILITY_DEFAULT_MESSAGE_AR;
  const filtersLabel = translate("unitsFilter.filters", "Filters");

  const getPropertyTypeLabel = useCallback(
    (value) => {
      if (!value) return "";
      const match = BUILDING_TYPES.find((type) => type.value === value);
      if (!match) return value;
      return locale === "ar" ? match.ar_label : match.en_label;
    },
    [BUILDING_TYPES, locale]
  );

  const getPriceLabel = useCallback(
    (min, max) => {
      if (!min && !max) return t.unitsFilter?.price ?? "Price";
      const minFmt = min ? formatPriceInput(min) : "";
      const maxFmt = max ? formatPriceInput(max) : "";
      if (minFmt && maxFmt) return `${minFmt} - ${maxFmt} EGP`;
      if (minFmt) return `${t.unitsFilter?.from || "From"} ${minFmt} EGP`;
      if (maxFmt) return `${t.unitsFilter?.upTo || "Up to"} ${maxFmt} EGP`;
      return t.unitsFilter?.price ?? "Price";
    },
    [t]
  );

  const activeFilters = useMemo(() => {
    const list = [];
    if (filter !== DEFAULT_VISIBILITY) {
      const option = visibilityOptions.find((o) => o.value === filter);
      list.push({
        key: "visibility",
        value: option?.label ?? filter,
      });
    }
    if (updatedAtDate?.trim()) {
      list.push({
        key: "updated_at",
        value: `${t.resalePage?.filterByUpdatedAt ?? "Updated date"}: ${updatedAtDate}`,
      });
    }
    if (propertyType?.trim()) {
      list.push({
        key: "property_type",
        value: getPropertyTypeLabel(propertyType),
      });
    }
    if (minPrice || maxPrice) {
      list.push({
        key: "price",
        value: getPriceLabel(minPrice, maxPrice),
      });
    }
    if (author?.trim()) {
      list.push({
        key: "author",
        value: resolveAuthorDisplayLabel(author, authorOptions),
      });
    }
    return list;
  }, [
    filter,
    updatedAtDate,
    propertyType,
    minPrice,
    maxPrice,
    author,
    authorOptions,
    visibilityOptions,
    t,
    getPropertyTypeLabel,
    getPriceLabel,
  ]);

  const activeFilterCount = activeFilters.length;

  const openMobileFilters = () => {
    setDraftFilter(filter);
    setDraftUpdatedAtDate(updatedAtDate);
    setDraftPropertyType(propertyType);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftAuthor(author);
    setIsMobileFiltersOpen(true);
  };

  const handleApplyMobileFilters = () => {
    setFilter(draftFilter || DEFAULT_VISIBILITY);
    setUpdatedAtDate(draftUpdatedAtDate);
    setPropertyType(draftPropertyType);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setAuthor(draftAuthor || "");
    setIsMobileFiltersOpen(false);
  };

  const clearAllFilters = useCallback(() => {
    setFilter(DEFAULT_VISIBILITY);
    setUpdatedAtDate("");
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setAuthor("");
    setDraftFilter(DEFAULT_VISIBILITY);
    setDraftUpdatedAtDate("");
    setDraftPropertyType("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftAuthor("");
    setPricePopoverMin("");
    setPricePopoverMax("");
  }, []);

  const handleClearAllAndCloseMobile = () => {
    clearAllFilters();
    setIsMobileFiltersOpen(false);
  };

  const handleRemoveFilter = (key) => {
    if (key === "visibility") setFilter(DEFAULT_VISIBILITY);
    if (key === "updated_at") setUpdatedAtDate("");
    if (key === "property_type") setPropertyType("");
    if (key === "author") setAuthor("");
    if (key === "price") {
      setMinPrice("");
      setMaxPrice("");
    }
  };

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

  const handleVisibilityChange = (e) => {
    const next = e?.target?.value || "";
    setFilter(next || DEFAULT_VISIBILITY);
  };

  const handlePriceApplyDesktop = () => {
    setMinPrice(pricePopoverMin);
    setMaxPrice(pricePopoverMax);
    setIsPriceDropdownOpen(false);
  };

  const openPriceDropdown = () => {
    setPricePopoverMin(minPrice);
    setPricePopoverMax(maxPrice);
    setIsPriceDropdownOpen(true);
  };

  const bulkSelectLabel = showBulkToolbar && (
    <label className="flex w-full items-center gap-2 min-h-11 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
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
  );

  const activeFiltersChips = activeFilterCount > 0 && (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeFilters.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-1.5 bg-gray-100 rounded-full ps-2.5 pe-1 py-1 text-sm text-gray-700 shrink-0 max-w-[200px]"
          >
            <p className="truncate text-xs">{item.value}</p>
            <button
              type="button"
              className="shrink-0 flex items-center justify-center min-h-10 min-w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              aria-label={translate("unitsFilter.clearall", "Clear")}
              onClick={() => handleRemoveFilter(item.key)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="shrink-0 flex items-center gap-1.5 min-h-10 px-2.5 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        onClick={clearAllFilters}
      >
        <Trash2 size={14} />
        <span className="hidden sm:inline">{t.unitsFilter?.clearall}</span>
      </button>
    </div>
  );

  const priceFields = (minValue, maxValue, onMinChange, onMaxChange, showApply, onApply) => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t.unitsFilter?.min ?? "Min"} EGP
        </label>
        <input
          type="text"
          inputMode="numeric"
          className="w-full px-2 py-2.5 min-h-11 text-base border rounded-md bg-white"
          value={formatPriceInput(minValue)}
          onChange={(e) => onMinChange(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t.unitsFilter?.max ?? "Max"} EGP
        </label>
        <input
          type="text"
          inputMode="numeric"
          className="w-full px-2 py-2.5 min-h-11 text-base border rounded-md bg-white"
          value={formatPriceInput(maxValue)}
          onChange={(e) => onMaxChange(e.target.value.replace(/\D/g, ""))}
          placeholder="5,000,000,000"
        />
      </div>
      {showApply && (
        <button
          type="button"
          className="w-full min-h-11 py-2 text-sm font-medium bg-primary text-white rounded-md"
          onClick={onApply}
        >
          {t.unitsFilter?.applay ?? "Apply"}
        </button>
      )}
    </div>
  );

  // Initial load only — keep filters mounted during refetch
  if (isLoading && !units?.length && !isError) {
    return <LoadingSpinner message="Loading resale units..." />;
  }

  if (isError && !units?.length) {
    return (
      <div className="container">
        <QueryErrorState
          error={error}
          refetch={refetch}
          isFetching={isFetching}
          title="Error loading resale units"
          message="Failed to load units. Please try again."
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-3 sm:space-y-4 min-w-0 w-full">
      <UnitCodeSearch />

      {/* Mobile chrome: mount after hydration to keep event handlers reliable */}
      {!isMounted ? (
        <div
          className="lg:hidden min-h-11 rounded-md bg-white/80 border border-[#E6E6E6] animate-pulse"
          aria-hidden
        />
      ) : (
        <div className="lg:hidden space-y-2 min-w-0">
          <div className="sticky top-12 z-20 lg:top-0 -mx-1 px-1 py-1 bg-[#E2DBFF]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[#E2DBFF]/80">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={openMobileFilters}
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
              </button>

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
                  <WhatsAppIcon className="w-5 h-5 text-green-600" />
                </button>
              )}
            </div>

            {bulkSelectLabel}
          </div>

          {activeFiltersChips}
        </div>
      )}

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
              data-resale-filter-sheet="open"
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
                  className="shrink-0 flex items-center justify-center min-h-11 min-w-11 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={translate("unitsFilter.closeFilters", "Close filters")}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                <div className="w-full min-w-0">
                  <SearchableDropdownSelect
                    name="filter_mobile"
                    options={visibilityOptions}
                    value={draftFilter}
                    onChange={(e) =>
                      setDraftFilter(e?.target?.value || DEFAULT_VISIBILITY)
                    }
                    showAllOption={false}
                    placeholder="Select filter"
                    className={FILTER_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <input
                    id="resale-updated-at-mobile"
                    type="date"
                    value={draftUpdatedAtDate}
                    onChange={(e) => setDraftUpdatedAtDate(e.target.value ?? "")}
                    className={DATE_INPUT_CLASS}
                    aria-label={
                      t.resalePage?.filterByUpdatedAt ?? "Filter by updated date"
                    }
                  />
                </div>

                <div className="w-full min-w-0">
                  <SearchableDropdownSelect
                    options={BUILDING_TYPES}
                    value={draftPropertyType === "all" ? "" : draftPropertyType}
                    onChange={(e) => setDraftPropertyType(e.target.value || "")}
                    name="property_type_mobile"
                    getValue={(type) => type.value}
                    getLabel={(type) =>
                      locale === "ar" ? type.ar_label : type.en_label
                    }
                    searchFields={["en_label", "ar_label", "value"]}
                    showAllOption={true}
                    allOptionLabel={
                      t.unitsFilter?.allPropertyTypes ?? "All Property Types"
                    }
                    placeholder={
                      t.unitsFilter?.allPropertyTypes ?? "All Property Types"
                    }
                    searchPlaceholder={
                      locale === "ar"
                        ? "ابحث عن نوع العقار..."
                        : "Search property types..."
                    }
                    className={FILTER_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <AuthorFilterSelect
                    name="author_mobile"
                    value={draftAuthor || ""}
                    onChange={(e) => setDraftAuthor(e?.target?.value || "")}
                    className={FILTER_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0 rounded-md border border-[#E6E6E6] bg-[#F6F7FB] p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    {t.unitsFilter?.price ?? "Price"}
                  </p>
                  {priceFields(
                    draftMinPrice,
                    draftMaxPrice,
                    setDraftMinPrice,
                    setDraftMaxPrice,
                    false
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2 z-[1]">
                <button
                  type="button"
                  onClick={handleClearAllAndCloseMobile}
                  className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 truncate px-2"
                >
                  {t.unitsFilter?.clearall}
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobileFilters}
                  className="min-h-11 flex-[1.4] rounded-md text-sm font-semibold shadow-sm truncate px-2 bg-primary text-white hover:bg-primary/90"
                >
                  {translate("unitsFilter.applyFilters", "Apply Filters")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Desktop filter bar — unchanged layout, lg+ only */}
      <div className="hidden lg:block p-4 space-y-4 bg-white rounded-lg shadow-md min-w-0">
        <div className="flex items-center flex-wrap gap-2 justify-between min-w-0">
          <div className="w-auto flex-1 min-w-0">
            <SearchableDropdownSelect
              name="filter"
              options={visibilityOptions}
              value={filter}
              onChange={handleVisibilityChange}
              showAllOption={false}
              placeholder="Select filter"
              className={FILTER_BUTTON_CLASS}
            />
          </div>
          <div className="w-auto flex-1 min-w-0">
            <input
              id="resale-updated-at"
              type="date"
              value={updatedAtDate}
              onChange={(e) => setUpdatedAtDate(e.target.value ?? "")}
              className={DATE_INPUT_CLASS}
              aria-label={
                t.resalePage?.filterByUpdatedAt ?? "Filter by updated date"
              }
            />
          </div>

          <div className="w-auto flex-1 min-w-0">
            <SearchableDropdownSelect
              options={BUILDING_TYPES}
              value={propertyType === "all" ? "" : propertyType}
              onChange={(e) => setPropertyType(e.target.value || "")}
              name="property_type"
              getValue={(type) => type.value}
              getLabel={(type) =>
                locale === "ar" ? type.ar_label : type.en_label
              }
              searchFields={["en_label", "ar_label", "value"]}
              showAllOption={true}
              allOptionLabel={
                t.unitsFilter?.allPropertyTypes ?? "All Property Types"
              }
              placeholder={
                t.unitsFilter?.allPropertyTypes ?? "All Property Types"
              }
              searchPlaceholder={
                locale === "ar"
                  ? "ابحث عن نوع العقار..."
                  : "Search property types..."
              }
              className={FILTER_BUTTON_CLASS}
            />
          </div>

          <div className="w-auto flex-1 min-w-0">
            <AuthorFilterSelect
              name="author"
              value={author || ""}
              onChange={(e) => setAuthor(e?.target?.value || "")}
              className={FILTER_BUTTON_CLASS}
            />
          </div>

          <div
            className="relative w-auto flex-1 min-w-0"
            ref={priceDropdownRef}
          >
            <button
              type="button"
              className="w-full px-2 py-[10px] h-11 min-h-11 bg-[#F6F7FB] rounded-[5px] border border-[#E6E6E6] text-[#494A4B] text-sm text-start focus:outline-none focus:ring-primary flex justify-between items-center"
              onClick={() =>
                isPriceDropdownOpen
                  ? setIsPriceDropdownOpen(false)
                  : openPriceDropdown()
              }
            >
              <span className="truncate">
                {getPriceLabel(minPrice, maxPrice)}
              </span>
              <ChevronDown size={22} className="inline-block mt-0.5 shrink-0" />
            </button>
            {isPriceDropdownOpen && (
              <div className="absolute z-[46] mt-1 w-full min-w-[200px] bg-white rounded-[5px] shadow-2xl p-3">
                {priceFields(
                  pricePopoverMin,
                  pricePopoverMax,
                  setPricePopoverMin,
                  setPricePopoverMax,
                  true,
                  handlePriceApplyDesktop
                )}
              </div>
            )}
          </div>
        </div>

        {showBulkToolbar && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 h-9 min-h-9 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
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
                ).replace(
                  "{count}",
                  String(bulkSelection.selectedUnitIds.size)
                )}
              </span>
            )}

            {bulkSelection.hasSelection && (
              <button
                type="button"
                onClick={handleOpenCheckAvailability}
                className="flex items-center gap-2 px-3 sm:px-4 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 h-9 min-h-9"
                title={translate(
                  "unitsFilter.bulkAvailability.checkButton",
                  "Send Message"
                )}
              >
                <WhatsAppIcon />
                <span>
                  {translate(
                    "unitsFilter.bulkAvailability.checkButton",
                    "Send Message"
                  )}
                </span>
              </button>
            )}
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">
              {t.unitsFilter?.activeFilter}
            </span>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((item) => (
                <div
                  key={`desktop-${item.key}`}
                  className="flex items-center gap-3 bg-gray-100 rounded px-1.5 py-1 text-sm text-gray-700"
                >
                  <p className="truncate max-w-[180px] text-xs">{item.value}</p>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 min-h-8 min-w-8 inline-flex items-center justify-center"
                    onClick={() => handleRemoveFilter(item.key)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              onClick={clearAllFilters}
            >
              <Trash2 size={16} />
              {t.unitsFilter?.clearall}
            </button>
          </div>
        )}
      </div>

      {isFetching ? (
        <LoadingSpinner
          message="Refreshing..."
          containerClassName="flex items-center justify-center min-h-[12rem] mt-6 sm:mt-12"
        />
      ) : (
        <UnitsGrid
          units={units}
          pagination={pagination}
          readonly={false}
          allowMissingFields
          linkQueryParams={unitsSourcePendingQueryString(true)}
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
    </div>
  );
}
