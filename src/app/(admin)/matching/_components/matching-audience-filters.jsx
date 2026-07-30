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
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">
        {translate("matching.sections.audience")}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
            {translate("matching.filters.ownerType")}
          </label>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
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

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-gray-600">
            {translate("matching.filters.dateRange")}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {DATE_PRESETS.map((preset) => {
              const selected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-medium border ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
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
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-500">
                {translate("matching.filters.startDate")}
              </span>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={startDay}
                onChange={(e) => {
                  const ymd = e.target.value;
                  if (!ymd) return;
                  patch({ start_date: toDashboardStartDateTime(ymd) });
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-500">
                {translate("matching.filters.endDate")}
              </span>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
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
            <p className="text-xs text-red-600 mt-1">
              {translate(
                "dashboardSummary.invalid_date_range",
                "Start date must be before or equal to end date",
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
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
            className="text-sm"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
          <label className="text-xs font-medium text-gray-600">
            {translate("matching.filters.search")}
          </label>
          <div className="flex gap-2">
            <input
              type="search"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
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
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
              onClick={() => patch({ query: searchDraft.trim() })}
            >
              {translate("matching.filters.search")}
            </button>
          </div>
        </div>
      </div>
    </div>
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
