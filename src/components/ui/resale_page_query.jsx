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
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { ChevronDown } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";

const VISIBILITY_OPTIONS = [
  { value: "all", label: null },
  { value: "pending_approval", label: null },
  { value: "visible", label: null },
  { value: "hidden", label: null },
  { value: "ai_generated", label: null },
];

export default function ResalePageQuery({ searchParams }) {
  const { t, locale } = useI18n();
  const visibilityOptions = useMemo(() => ([
    { value: "all", label: t?.common?.all ?? "All" },
    { value: "pending_approval", label: t?.unitsFilter?.pendingApproval ?? "Pending Approval" },
    { value: "visible", label: t?.common?.show ?? "Visible" },
    { value: "hidden", label: t?.common?.hide ?? "Hidden" },
    { value: "ai_generated", label: t?.common?.aiGenerated ?? "AI Generated" },
  ]), [t]);
  const [filter, setFilter] = useState("all");
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
    const withFilter =
      filter === "all"
        ? base
        : filter === "ai_generated"
          ? { ...base, dataSource: "ai_generated" }
          : { ...base, visibility: filter };
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

  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    usePendingApprovalUnitsPageData(searchParamsKey);

  // Refetch when filters change to ensure API is triggered
  useEffect(() => {
    refetch();
  }, [filter, updatedAtDate, propertyType, minPrice, maxPrice, refetch]);

  const handleFilterChange = (e) => {
    const next = e?.target?.value || "";
    setFilter(next || "all");
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
    </div>
  );
}
