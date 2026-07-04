"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { usePendingApprovalUnitsPageData } from "@/hooks/use-pending-approval-units-page-data";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { unitsSourcePendingQueryString } from "@/utils/units-navigation-source";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { BULK_AVAILABILITY_DEFAULT_MESSAGE_AR } from "@/lib/units/unit-whatsapp-recipient";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { ChevronDown } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const DEFAULT_VISIBILITY = "pending_approval";

export default function ResalePageQuery({ searchParams, initialUnitsData = null }) {
  const { t, locale, translate } = useI18n();
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const bulkSelection = useUnitsBulkSelectionOptional();
  const [isMounted, setIsMounted] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const visibilityOptions = useMemo(() => ([
    { value: "pending_approval", label: t?.unitsFilter?.pendingApproval ?? "Pending Approval" },
    { value: "hidden", label: t?.unitsFilter?.hidden ?? "Hidden" },
  ]), [t]);
  const [filter, setFilter] = useState(DEFAULT_VISIBILITY);
  const [updatedAtDate, setUpdatedAtDate] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const priceDropdownRef = useRef(null);

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
    return JSON.stringify(withPrice);
  }, [searchParams, filter, updatedAtDate, propertyType, minPrice, maxPrice]);

  const hasActiveClientFilters =
    Boolean(updatedAtDate?.trim()) ||
    Boolean(propertyType?.trim()) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
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

  const showBulkToolbar = isMounted && canShowBulkButton && bulkSelection;
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

  const handleFilterChange = (e) => {
    const next = e?.target?.value || "";
    setFilter(next || DEFAULT_VISIBILITY);
  };

  function formatPriceInput(value) {
    if (!value) return "";
    const numericValue = String(value).replace(/\D/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function getPriceDisplayText() {
    if (minPrice || maxPrice) {
      const min = minPrice ? formatPriceInput(minPrice) : "";
      const max = maxPrice ? formatPriceInput(maxPrice) : "";
      if (min && max) return `${min} - ${max} EGP`;
      if (min) return `${t.unitsFilter?.from || "From"} ${min} EGP`;
      if (max) return `${t.unitsFilter?.upTo || "Up to"} ${max} EGP`;
    }
    return t.unitsFilter?.price ?? "Price";
  }

  const handlePriceApply = () => {
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setIsPriceDropdownOpen(false);
  };

  const openPriceDropdown = () => {
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setIsPriceDropdownOpen(true);
  };

  if (isLoading || isFetching) {
    return <LoadingSpinner message="Loading resale units..." />;
  }

  if (isError) {
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
    <div className="flex-1 flex flex-col space-y-4">
      {/* Header/filter bar – same style as Units tab (units-filter card) */}
      <div className="p-4 space-y-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <SearchableDropdownSelect
              name="filter"
              options={visibilityOptions}
              value={filter}
              onChange={handleFilterChange}
              showAllOption={false}
              placeholder="Select filter"
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />
          </div>
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <input
              id="resale-updated-at"
              type="date"
              value={updatedAtDate}
              onChange={(e) => setUpdatedAtDate(e.target.value ?? "")}
              className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border border-[#E6E6E6] text-[#494A4B] text-sm focus:outline-none focus:ring-primary focus:border-primary"
              aria-label={t.resalePage?.filterByUpdatedAt ?? "Filter by updated date"}
            />
          </div>

          {/* Property Type */}
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <SearchableDropdownSelect
              options={BUILDING_TYPES}
              value={propertyType === "all" ? "" : propertyType}
              onChange={(e) => setPropertyType(e.target.value || "")}
              name="property_type"
              getValue={(type) => type.value}
              getLabel={(type) => (locale === "ar" ? type.ar_label : type.en_label)}
              searchFields={["en_label", "ar_label", "value"]}
              showAllOption={true}
              allOptionLabel={t.unitsFilter?.allPropertyTypes ?? "All Property Types"}
              placeholder={t.unitsFilter?.allPropertyTypes ?? "All Property Types"}
              searchPlaceholder={locale === "ar" ? "ابحث عن نوع العقار..." : "Search property types..."}
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />
          </div>

          {/* Price Filter */}
          <div
            className="relative w-full md:w-auto md:flex-1 min-w-0"
            ref={priceDropdownRef}
          >
            <button
              type="button"
              className="w-full px-2 py-[10px] h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm text-left focus:outline-none focus:ring-primary flex justify-between items-center"
              onClick={() => (isPriceDropdownOpen ? setIsPriceDropdownOpen(false) : openPriceDropdown())}
            >
              <span className="truncate">{getPriceDisplayText()}</span>
              <ChevronDown size={22} className="inline-block mt-0.5 shrink-0" />
            </button>
            {isPriceDropdownOpen && (
              <div className="absolute z-[46] mt-1 w-full md:min-w-[200px] bg-white rounded-[5px] shadow-2xl p-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.unitsFilter?.min ?? "Min"} EGP
                    </label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 text-sm border rounded-md"
                      value={formatPriceInput(draftMinPrice)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setDraftMinPrice(value);
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.unitsFilter?.max ?? "Max"} EGP
                    </label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 text-sm border rounded-md"
                      value={formatPriceInput(draftMaxPrice)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setDraftMaxPrice(value);
                      }}
                      placeholder="5,000,000,000"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full py-1.5 text-sm bg-primary text-white rounded-md"
                    onClick={handlePriceApply}
                  >
                    {t.unitsFilter?.applay ?? "Apply"}
                  </button>
                </div>
              </div>
            )}
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
                <span className="hidden sm:inline">
                  {translate(
                    "unitsFilter.bulkAvailability.checkButton",
                    "Send Message"
                  )}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {isFetching ? (
        <LoadingSpinner
          message="Refreshing..."
          containerClassName="flex items-center justify-center h-full mt-12"
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
