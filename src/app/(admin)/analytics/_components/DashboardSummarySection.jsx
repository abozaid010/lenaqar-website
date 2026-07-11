"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  AlertCircle,
  Ban,
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  LayoutGrid,
  Phone,
  RefreshCw,
  Share2,
  Sparkles,
  Tag,
  ThumbsDown,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { fetchDashboardSummary, getClientid } from "@/utils/api";
import { ACTIONS_COLORS, getActionLabel, getFilterActions } from "@/utils/actions";
import { cairoDateDaysAgo, cairoDateToday } from "@/utils/cairoDate";
import { debounce } from "@/utils/debounce";
import { isValidDashboardDateRange } from "@/utils/dashboardDate";
import toast from "react-hot-toast";

function translateKpi(translate, key) {
  return translate(`dashboardSummary.kpi_${key}`);
}

const KPI_CONFIG = [
  {
    key: "updated_users_count",
    icon: UserCheck,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-700",
  },
  {
    key: "units_shared_count",
    icon: Share2,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    key: "pending_approval_units_count",
    icon: EyeOff,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  {
    key: "units_added_count",
    icon: Building2,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    key: "units_sold_count",
    icon: Tag,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
  },
  {
    key: "units_rented_count",
    icon: KeyRound,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
  },
];

const ACTION_ICONS = {
  new: Users,
  "Make a call": Phone,
  "Office visit": Building2,
  "Property view": Eye,
  "Qualified lead": BadgeCheck,
  "Not interested": ThumbsDown,
  Interested: Heart,
  "Not qualified": XCircle,
  "Follow up later": Clock,
  "Missing requirement": AlertCircle,
  Blocked: Ban,
};

function readSummaryCount(data, key) {
  const value = data?.[key];
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function SummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl h-20" />
      <div className="bg-primary/5 rounded-xl h-24" />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl h-40" />
    </div>
  );
}

export default function DashboardSummarySection() {
  const { translate, locale, localeUtils } = useI18n();
  const clientId = getClientid();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(() => cairoDateDaysAgo(7));
  const [endDate, setEndDate] = useState(() => cairoDateToday());
  const [debouncedRange, setDebouncedRange] = useState({
    startDate: cairoDateDaysAgo(7),
    endDate: cairoDateToday(),
  });

  const isInvalidRange = !isValidDashboardDateRange(startDate, endDate);
  const canFetch = Boolean(clientId) && isValidDashboardDateRange(
    debouncedRange.startDate,
    debouncedRange.endDate
  );

  const debouncedUpdateRange = useCallback(
    debounce((nextStartDate, nextEndDate) => {
      setDebouncedRange({ startDate: nextStartDate, endDate: nextEndDate });
    }, 300),
    []
  );

  useEffect(() => {
    debouncedUpdateRange(startDate, endDate);
  }, [startDate, endDate, debouncedUpdateRange]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [
      "dashboard-summary",
      clientId,
      debouncedRange.startDate,
      debouncedRange.endDate,
    ],
    queryFn: () =>
      fetchDashboardSummary(clientId, {
        startDate: debouncedRange.startDate,
        endDate: debouncedRange.endDate,
      }),
    enabled: canFetch,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });

  const kpiValues = useMemo(
    () =>
      KPI_CONFIG.reduce((acc, { key }) => {
        acc[key] = readSummaryCount(data, key);
        return acc;
      }, {}),
    [data]
  );

  const totalLeads = readSummaryCount(data, "total_leads");
  const newUsersCount = readSummaryCount(data, "new_users_count");

  const actionItems = useMemo(() => {
    const actionsByType = data?.actions_by_type || {};
    return getFilterActions().map((action) => ({
      value: action.value,
      label: getActionLabel(action.value, locale),
      count: readSummaryCount(actionsByType, action.value),
      colorClass: ACTIONS_COLORS[action.value] || "text-gray-800",
      Icon: ACTION_ICONS[action.value] || Users,
    }));
  }, [data?.actions_by_type, locale]);

  const formattedRange = useMemo(() => {
    const rangeStart = data?.start_date || debouncedRange.startDate;
    const rangeEnd = data?.end_date || debouncedRange.endDate;
    if (!rangeStart || !rangeEnd) return null;
    return `${localeUtils.formatDate(rangeStart)} — ${localeUtils.formatDate(rangeEnd)}`;
  }, [data?.start_date, data?.end_date, debouncedRange.startDate, debouncedRange.endDate, localeUtils]);

  const newInPeriodSubtitle = translate("dashboardSummary.new_in_period").replace(
    "{count}",
    localeUtils.formatNumber(newUsersCount)
  );

  const isContentLoading = isFetching && !isRefreshing;
  const isRefreshBusy = isRefreshing;

  const handleRefresh = async () => {
    if (!clientId || isRefreshing || isInvalidRange) return;

    setIsRefreshing(true);
    try {
      const freshData = await fetchDashboardSummary(clientId, {
        refresh: true,
        startDate: debouncedRange.startDate,
        endDate: debouncedRange.endDate,
      });
      queryClient.setQueryData(
        ["dashboard-summary", clientId, debouncedRange.startDate, debouncedRange.endDate],
        freshData
      );
      toast.success(translate("dashboardSummary.refresh_success"));
    } catch (error) {
      console.error("Failed to refresh dashboard summary:", error?.message ?? error);
      toast.error(translate("dashboardSummary.refresh_failed"));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="w-full p-2 mb-4">
        <SummarySkeleton />
      </div>
    );
  }

  return (
    <div className="w-full p-2 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold mb-1">
            {translate("dashboardSummary.title")}
          </h2>
          <p className="text-gray-600 text-sm">
            {translate("dashboardSummary.description")}
          </p>
          {formattedRange && (
            <span className="inline-flex mt-2 items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {formattedRange}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0 sm:min-w-[280px]">
            <div>
              <label
                htmlFor="dashboard-summary-start-date"
                className="block text-xs text-gray-600 mb-1"
              >
                {translate("dashboardSummary.start_date_label")}
              </label>
              <input
                id="dashboard-summary-start-date"
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={isRefreshBusy}
              />
            </div>
            <div>
              <label
                htmlFor="dashboard-summary-end-date"
                className="block text-xs text-gray-600 mb-1"
              >
                {translate("dashboardSummary.end_date_label")}
              </label>
              <input
                id="dashboard-summary-end-date"
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={isRefreshBusy}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshBusy || !clientId || isInvalidRange}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 shrink-0 ${isRefreshBusy ? "animate-spin" : ""}`}
              aria-hidden
            />
            {isRefreshBusy
              ? translate("dashboardSummary.refreshing")
              : translate("dashboardSummary.refresh")}
          </button>
        </div>
      </div>

      {isInvalidRange && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {translate("dashboardSummary.invalid_date_range")}
        </p>
      )}

      {isError && (
        <div
          className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          <span>{translate("dashboardSummary.fetch_failed")}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
          >
            {translate("common.retry")}
          </button>
        </div>
      )}

      <div
        className={`bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-4 transition-opacity ${
          isContentLoading ? "opacity-70" : ""
        }`}
      >
        {data?.narrative ? (
          <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
              <p className="text-sm md:text-base text-gray-800 leading-relaxed">{data.narrative}</p>
            </div>
          </div>
        ) : (
          !isContentLoading && (
            <p className="text-sm text-gray-500 text-center">
              {translate("dashboardSummary.no_data")}
            </p>
          )
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            className={`rounded-xl border px-3 py-3 text-center sm:text-start ${
              totalLeads > 0 ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                <Users className="h-4 w-4 text-sky-700" aria-hidden />
              </span>
              <p className="text-xs text-gray-500 leading-snug">
                {translate("dashboardSummary.kpi_total_leads")}
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${totalLeads > 0 ? "text-primary" : "text-gray-400"}`}
            >
              {localeUtils.formatNumber(totalLeads)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{newInPeriodSubtitle}</p>
          </div>

          {KPI_CONFIG.map(({ key, icon: Icon, iconBg, iconColor }) => {
            const value = kpiValues[key];
            const hasValue = value > 0;
            return (
              <div
                key={key}
                className={`rounded-xl border px-3 py-3 text-center sm:text-start ${
                  hasValue ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
                  </span>
                  <p className="text-xs text-gray-500 leading-snug">
                    {translateKpi(translate, key)}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${hasValue ? "text-primary" : "text-gray-400"}`}>
                  {localeUtils.formatNumber(value)}
                </p>
              </div>
            );
          })}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <LayoutGrid className="h-4 w-4 text-primary shrink-0" aria-hidden />
              {translate("dashboardSummary.board_actions")}
            </p>
            <span className="text-xs text-gray-500">
              {translate("dashboardSummary.actions_total")}:{" "}
              <span className="font-semibold text-primary">
                {localeUtils.formatNumber(readSummaryCount(data, "actions_total"))}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {actionItems.map((action) => {
              const hasCount = action.count > 0;
              const ActionIcon = action.Icon;
              return (
                <div
                  key={action.value}
                  className={`rounded-lg border px-3 py-2 ${
                    hasCount ? "border-gray-200 bg-white" : "border-transparent bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 min-w-0">
                    <ActionIcon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        hasCount ? "text-gray-500" : "text-gray-400"
                      }`}
                      aria-hidden
                    />
                    <p className="text-xs text-gray-500 truncate" title={action.label}>
                      {action.label}
                    </p>
                  </div>
                  <p
                    className={`text-lg font-bold ps-5 ${
                      hasCount ? action.colorClass : "text-gray-400"
                    }`}
                  >
                    {localeUtils.formatNumber(action.count)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
