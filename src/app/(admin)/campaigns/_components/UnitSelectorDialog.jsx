"use client";

import Dialog from "@/components/ui/Dialog";
import ImageWithLoader from "@/components/ui/image-with-loader";
import LoadingSpinner from "@/components/ui/loading-spinner";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useProjectsNames, useDeveloperNames } from "@/hooks/use-admin-shared-data";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { fetchUnitsFilter } from "@/utils/api";
import { formatPrice } from "@/utils/formatters";
import en from "../../../../../public/locales/en";
import ar from "../../../../../public/locales/ar";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const EnumPropertyIntent = ["rent", "sell"];

function getFirstUnitImage(unit) {
  if (unit?.image) return String(unit.image);
  const imgs = Array.isArray(unit?.images) ? unit.images : [];
  const first = imgs.find((x) => x?.url)?.url;
  return first || "/images/property_placeholder.jpg";
}

export default function UnitSelectorDialog({ isOpen, onClose, onSelect }) {
  const { t, locale, translate } = useI18n();
  const c = t?.campaigns || {};
  const clientId = LenaCookiesManager.getClientId() || "";

  const { data: projectsData, isLoading: projectsLoading } = useProjectsNames(
    false
  );
  const { data: developersData, isLoading: developersLoading } =
    useDeveloperNames();

  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const [filters, setFilters] = useState({
    city: "",
    developer_name: "",
    project_name: "",
    purpose: "",
    property_type: "",
    min_price: "",
    max_price: "",
  });

  const [cursor, setCursor] = useState(null);
  const [direction, setDirection] = useState(null);

  // Reset pagination when filters change
  useEffect(() => {
    setCursor(null);
    setDirection(null);
  }, [
    filters.city,
    filters.developer_name,
    filters.project_name,
    filters.purpose,
    filters.property_type,
    filters.min_price,
    filters.max_price,
  ]);

  const requestParams = useMemo(() => {
    const params = {
      visibility: "visible",
      ...(clientId ? { client_id: clientId } : {}),
    };

    // Only send filters if they have values
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        params[k] = v;
      }
    });

    if (cursor) {
      params.cursor = cursor;
      params.direction = direction || t?.common?.forward || "forward";
    }

    return params;
  }, [clientId, cursor, direction, filters]);

  const paramsKey = useMemo(() => JSON.stringify(requestParams), [requestParams]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["unit-selector", paramsKey],
    queryFn: () => fetchUnitsFilter(requestParams),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: isOpen,
  });

  const units = data?.data?.units || [];
  const pagination = data?.data?.pagination || null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("campaigns.unitSelectorTitle")}
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <SearchableCitySelect
              value={filters.city}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, city: e.target.value || "" }))
              }
              name="city"
              showAllOption={true}
              allOptionLabel={translate("unitsFilter.allCities")}
              placeholder={translate("unitsFilter.allCities")}
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />

            <SearchableDropdownSelect
              options={developersData || []}
              value={filters.developer_name}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  developer_name: e.target.value || "",
                }))
              }
              name="developer_name"
              getValue={(dev) => dev.name}
              getLabel={(dev, loc) => (loc === "ar" ? dev.ar_name : dev.en_name)}
              searchFields={["en_name", "ar_name", "name"]}
              showAllOption={true}
              allOptionLabel={translate("unitsFilter.allDevelopers")}
              placeholder={translate("unitsFilter.allDevelopers")}
              isLoading={developersLoading}
              loadingText={locale === "ar" ? "جاري التحميل..." : "Loading developers..."}
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />

            <SearchableProjectSelect
              value={filters.project_name}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  project_name: e.target.value || "",
                }))
              }
              name="project_name"
              projects={projectsData || []}
              isPublic={false}
              isLoading={projectsLoading}
              showAllOption={true}
              allOptionLabel={translate("unitsFilter.allCompounds")}
              placeholder={translate("unitsFilter.allCompounds")}
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />

            <SearchableDropdownSelect
              options={EnumPropertyIntent.map((purpose) => ({
                value: purpose,
                label: translate(`unitsFilter.purposes.${purpose}`) || purpose,
              }))}
              value={filters.purpose}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, purpose: e.target.value || "" }))
              }
              name="purpose"
              showAllOption={true}
              allOptionLabel={translate("unitsFilter.allPurposes")}
              placeholder={translate("unitsFilter.allPurposes")}
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />

            <SearchableDropdownSelect
              options={BUILDING_TYPES}
              value={filters.property_type}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  property_type: e.target.value || "",
                }))
              }
              name="property_type"
              getValue={(type) => type.value}
              getLabel={(type, loc) => (loc === "ar" ? type.ar_label : type.en_label)}
              searchFields={["en_label", "ar_label", "value"]}
              showAllOption={true}
              allOptionLabel={translate("unitsFilter.allPropertyTypes")}
              placeholder={translate("unitsFilter.allPropertyTypes")}
              className="[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-[40px] [&>div>button]:px-2 [&>div>button]:py-[10px]"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={filters.min_price}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    min_price: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder={translate("unitsFilter.min")}
                className="w-full px-2 py-2 h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm"
              />
              <input
                type="text"
                value={filters.max_price}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    max_price: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder={translate("unitsFilter.max")}
                className="w-full px-2 py-2 h-[40px] bg-[#F6F7FB] rounded-[5px] border-[1px] border-[#E6E6E6] text-[#494A4B] text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  city: "",
                  developer_name: "",
                  project_name: "",
                  purpose: "",
                  property_type: "",
                  min_price: "",
                  max_price: "",
                });
              }}
              className="px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
            >
              {translate("campaigns.clear")}
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
            >
              {isFetching ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {translate("common.loading")}
                </span>
              ) : (
                translate("campaigns.refresh")
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {isLoading ? (
            <LoadingSpinner message={translate("campaigns.loadingUnits")} />
          ) : isError ? (
            <div className="text-red-600 text-sm">
              {error?.message || translate("campaigns.failedToLoadUnits")}
            </div>
          ) : units.length === 0 ? (
            <div className="text-gray-600 text-sm">
              {translate("campaigns.noUnitsFound")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {units.map((u) => (
                <div
                  key={u?.unitId || u?.id || JSON.stringify(u)}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full h-44 bg-gray-100">
                    <ImageWithLoader
                      src={getFirstUnitImage(u)}
                      alt={u?.unitTitle || translate("campaigns.unit")}
                      className="w-full h-full object-cover"
                      priority={false}
                      loadingVariant="minimal"
                      sizes="400px"
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-gray-900 line-clamp-1">
                      {u?.unitTitle ||
                        u?.project ||
                        u?.code ||
                        translate("campaigns.unnamedUnit")}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {u?.project ? `${translate("campaigns.project")}: ${u.project}` : null}
                      {u?.city ? ` • ${translate("campaigns.city")}: ${u.city}` : null}
                    </div>

                    <div className="mt-2 text-xs text-gray-700 flex flex-wrap gap-2">
                      {u?.purpose ? (
                        <span className="px-2 py-1 rounded bg-gray-100">
                          {String(u.purpose)}
                        </span>
                      ) : null}
                      {u?.totalPrice ?? u?.price ? (
                        <span className="px-2 py-1 rounded bg-gray-100">
                          {formatPrice(u.totalPrice ?? u.price)} EGP
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect?.(u);
                          onClose?.();
                        }}
                        className="px-3 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
                      >
                        {translate("campaigns.select")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination (cursor based) */}
          {pagination && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                disabled={!pagination?.has_more_prev}
                onClick={() => {
                  setCursor(pagination?.prev_cursor || null);
                  setDirection("backward");
                }}
                className="px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
              >
                {translate("common.previous")}
              </button>
              <button
                type="button"
                disabled={!pagination?.has_more_next}
                onClick={() => {
                  setCursor(pagination?.next_cursor || null);
                  setDirection("forward");
                }}
                className="px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
              >
                {translate("common.next")}
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

