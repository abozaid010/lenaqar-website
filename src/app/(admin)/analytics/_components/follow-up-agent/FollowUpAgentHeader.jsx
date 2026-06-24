"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { debounce } from "@/utils/debounce";
import { cairoDateToday } from "@/utils/cairoDate";

const TREND_OPTIONS = ["7", "30"];

export default function FollowUpAgentHeader({ sources = [], hasSummary }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translate } = useI18n();
  const [isPending, startTransition] = useTransition();

  const agentDate = searchParams.get("agent_date") || cairoDateToday();
  const agentTrend = searchParams.get("agent_trend") || "7";
  const [localDate, setLocalDate] = useState(agentDate);

  const hasManualSource = sources.includes("manual");

  useEffect(() => {
    setLocalDate(agentDate);
  }, [agentDate]);

  const pushParams = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const debouncedDateUpdate = useCallback(
    debounce((value) => {
      pushParams("agent_date", value);
    }, 300),
    [pushParams]
  );

  const handleDateChange = (value) => {
    setLocalDate(value);
    debouncedDateUpdate(value);
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {translate("analytics.followUpAgent.title")}
          </h2>
          <p className="text-gray-600 text-sm">
            {translate("analytics.followUpAgent.description")}
          </p>
          <span className="inline-flex mt-2 items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            {translate("analytics.followUpAgent.schedule_badge")}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {translate("analytics.followUpAgent.date_label")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={localDate}
                onChange={(event) => handleDateChange(event.target.value)}
                disabled={isPending}
              />
              {hasManualSource && hasSummary && (
                <span className="shrink-0 rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-medium whitespace-nowrap">
                  {translate("analytics.followUpAgent.manual_run_badge")}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {translate("analytics.followUpAgent.trend_range_label")}
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={agentTrend}
              onChange={(event) => pushParams("agent_trend", event.target.value)}
              disabled={isPending}
            >
              {TREND_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {translate(`analytics.followUpAgent.trend_${days}_days`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
