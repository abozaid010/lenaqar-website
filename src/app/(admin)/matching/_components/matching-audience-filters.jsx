"use client";

import { useMemo, useState } from "react";
import ActionSelect from "@/components/actions/ActionSelect";
import { useI18n } from "@/hooks/useI18n";
import {
  OWNER_TYPES,
  getOwnerTypeLabel,
  serializeOwnerTypeFilter,
} from "@/constants/owner-type";
import {
  buildDashboardDateRangeDaysAgo,
  getDashboardDateDay,
  getDefaultDashboardEndDate,
  getDefaultDashboardStartDate,
  isValidDashboardDateRange,
  toDashboardEndDateTime,
  toDashboardStartDateTime,
} from "@/utils/dashboardDate";
import {
  parseDashboardActionFilter,
  serializeDashboardActionFilter,
} from "@/utils/action-constants";
import {
  CalendarRange,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

const DATE_PRESETS = [
  { id: "0", daysAgo: 0, labelKey: "matching.filters.today", fallback: "Today" },
  { id: "7", daysAgo: 7, labelKey: "matching.filters.lastWeek", fallback: "Last week" },
  { id: "30", daysAgo: 30, labelKey: "matching.filters.lastMonth", fallback: "Last month" },
  { id: "90", daysAgo: 90, labelKey: "matching.filters.last3Months", fallback: "Last 3 months" },
  { id: "365", daysAgo: 365, labelKey: "matching.filters.lastYear", fallback: "Last year" },
];

/**
 * Compact audience filters for Matching (same API params as Leads).
 */
export default function MatchingAudienceFilters({ filters, onChange }) {
  const { translate } = useI18n();
  const [searchDraft, setSearchDraft] = useState(filters.query || "");
  const [isExpanded, setIsExpanded] = useState(false);

  const startDay = getDashboardDateDay(filters.start_date) || "";
  const endDay = getDashboardDateDay(filters.end_date) || "";
  const isDateInvalid = !isValidDashboardDateRange(
    filters.start_date,
    filters.end_date,
  );

  const activePresetId = useMemo(() => {
    return (
      DATE_PRESETS.find((preset) => {
        const range = buildDashboardDateRangeDaysAgo(preset.daysAgo);
        return (
          getDashboardDateDay(range.start_date) === startDay &&
          getDashboardDateDay(range.end_date) === endDay
        );
      })?.id ?? null
    );
  }, [startDay, endDay]);

  const actionValues = parseDashboardActionFilter(filters.action);

  const patch = (partial) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        className={`flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-gray-50 sm:px-5 ${
          isExpanded ? "border-b border-gray-100" : ""
        }`}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls="matching-audience-filters"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-gray-900">
            {translate("matching.sections.audience")}
          </span>
          <span className="mt-0.5 block truncate text-xs leading-5 text-gray-500">
            {translate("matching.filters.audienceHint")}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-primary">
          {translate(
            isExpanded
              ? "matching.filters.hideFilters"
              : "matching.filters.showFilters",
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      {isExpanded && (
        <div
          id="matching-audience-filters"
          className="space-y-5 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <fieldset className="min-w-0 space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          <legend className="px-1">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              {translate("matching.filters.leadDetails")}
            </span>
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="matching_owner_type"
                className="text-xs font-medium text-gray-700"
              >
                {translate("matching.filters.ownerType")}
              </label>
              <select
                id="matching_owner_type"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={filters.owner_type || ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const serialized = serializeOwnerTypeFilter(raw);
                  patch({ owner_type: serialized || "" });
                }}
              >
                <option value="">
                  {translate("matching.filters.ownerTypeAll")}
                </option>
                {OWNER_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {getOwnerTypeLabel(value, translate)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700">
                {translate("matching.filters.leadAction")}
              </label>
              <ActionSelect
                selectionMode="multiple"
                includeFilterOnly
                ownerType={filters.owner_type || null}
                values={actionValues}
                onValuesChange={(values) => {
                  patch({
                    action: serializeDashboardActionFilter(values) || "",
                  });
                }}
                className="min-h-10 bg-white text-sm"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          <legend className="px-1">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
              {translate("matching.filters.dateRange")}
            </span>
          </legend>

          <div
            className="flex flex-wrap gap-2"
            aria-label={translate("matching.filters.presets")}
          >
            {DATE_PRESETS.map((preset) => {
              const selected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:bg-primary/5"
                  }`}
                  onClick={() => {
                    const range = buildDashboardDateRangeDaysAgo(preset.daysAgo);
                    patch({
                      start_date: range.start_date,
                      end_date: range.end_date,
                    });
                  }}
                >
                  {translate(preset.labelKey, preset.fallback)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="matching_start_date"
                className="text-xs font-medium text-gray-700"
              >
                {translate("matching.filters.startDate")}
              </label>
              <input
                id="matching_start_date"
                type="date"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={startDay}
                onChange={(e) => {
                  const ymd = e.target.value;
                  if (!ymd) return;
                  patch({ start_date: toDashboardStartDateTime(ymd) });
                }}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="matching_end_date"
                className="text-xs font-medium text-gray-700"
              >
                {translate("matching.filters.endDate")}
              </label>
              <input
                id="matching_end_date"
                type="date"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={endDay}
                onChange={(e) => {
                  const ymd = e.target.value;
                  if (!ymd) return;
                  patch({ end_date: toDashboardEndDateTime(ymd) });
                }}
              />
            </div>
          </div>
          {isDateInvalid && (
            <p className="text-xs text-red-600" role="alert">
              {translate(
                "dashboardSummary.invalid_date_range",
                "Start date must be before or equal to end date",
              )}
            </p>
          )}
        </fieldset>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
            <label
              htmlFor="matching_search"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
            >
              <Search className="h-4 w-4 text-primary" aria-hidden="true" />
              {translate("matching.filters.search")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="matching_search"
                type="search"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={translate("matching.filters.searchPlaceholder")}
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    patch({ query: searchDraft.trim() });
                  }
                }}
              />
              <button
                type="button"
                className="h-10 shrink-0 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                onClick={() => patch({ query: searchDraft.trim() })}
              >
                {translate("matching.filters.search")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function getDefaultMatchingFilters() {
  return {
    owner_type: "",
    start_date: getDefaultDashboardStartDate(),
    end_date: getDefaultDashboardEndDate(),
    action: "",
    query: "",
  };
}
