"use client";

import React, { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { fetchDashboardSummary, getClientid } from "@/utils/api";
import { ACTIONS_COLORS, getActionLabel, getFilterActions } from "@/utils/actions";
import toast from "react-hot-toast";

const PERIOD_OPTIONS = ["day", "week", "month"];

function translatePeriod(translate, period) {
  return translate(`dashboardSummary.period_${period}`);
}

function translateKpi(translate, key) {
  return translate(`dashboardSummary.kpi_${key}`);
}

const KPI_CONFIG = [
  {
    key: "new_users_count",
    icon: UserPlus,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
  },
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
    key: "units_shared_hidden_count",
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
  new: UserPlus,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translate, locale, localeUtils } = useI18n();
  const clientId = getClientid();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const periodParam = searchParams.get("summary_period") || "day";
  const period = PERIOD_OPTIONS.includes(periodParam) ? periodParam : "day";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", clientId, period],
    queryFn: () => fetchDashboardSummary(clientId, { period }),
    enabled: Boolean(clientId),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
  });

  const kpiValues = useMemo(
    () =>
      KPI_CONFIG.reduce((acc, { key }) => {
        acc[key] = readSummaryCount(data, key);
        return acc;
      }, {}),
    [data]
  );

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

  const formattedDate = data?.date ? localeUtils.formatDate(data.date) : null;
  const isPeriodBusy = isRefreshing || isPending;
  const isRefreshBusy = isRefreshing;

  const handlePeriodChange = useCallback(
    (nextPeriod) => {
      if (nextPeriod === period) return;

      const params = new URLSearchParams(searchParams.toString());
      if (nextPeriod === "day") {
        params.delete("summary_period");
      } else {
        params.set("summary_period", nextPeriod);
      }

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [period, router, searchParams]
  );

  const handleRefresh = async () => {
    if (!clientId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const freshData = await fetchDashboardSummary(clientId, { refresh: true, period });
      queryClient.setQueryData(["dashboard-summary", clientId, period], freshData);
      toast.success(translate("dashboardSummary.refresh_success"));
    } catch (error) {
      console.error("Failed to refresh dashboard summary:", error);
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
          {(formattedDate || period !== "day") && (
            <span className="inline-flex mt-2 items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {period === "day" && formattedDate
                ? `${translatePeriod(translate, "day")}: ${formattedDate}`
                : translatePeriod(translate, period)}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div
            className="inline-flex rounded-lg border border-gray-200 bg-white p-1"
            role="tablist"
            aria-label={translate("dashboardSummary.period_label")}
          >
            {PERIOD_OPTIONS.map((option) => {
              const isActive = period === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handlePeriodChange(option)}
                  disabled={isPeriodBusy}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {translatePeriod(translate, option)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshBusy || !clientId}
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

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-4">
        {data?.narrative ? (
          <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
              <p className="text-sm md:text-base text-gray-800 leading-relaxed">{data.narrative}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            {translate("dashboardSummary.no_data")}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
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
