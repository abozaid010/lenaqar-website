"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/useI18n";
import {
  emptyFollowUpTotals,
  fetchFollowUpSummary,
  fetchFollowUpSummaryRange,
  getClientid,
} from "@/utils/api";
import { cairoDateSubtract, cairoDateToday } from "@/utils/cairoDate";
import FollowUpAgentHeader from "./FollowUpAgentHeader";
import FollowUpAgentKpiCards from "./FollowUpAgentKpiCards";
import FollowUpAgentTrendChart from "./FollowUpAgentTrendChart";
import FollowUpAgentLeadsTable from "./FollowUpAgentLeadsTable";

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl h-28" />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-white rounded-xl h-72" />
      <div className="bg-white rounded-xl h-72" />
    </div>
  );
}

export default function FollowUpAgentSection() {
  const searchParams = useSearchParams();
  const { translate } = useI18n();
  const clientId = getClientid();

  const agentDate = searchParams.get("agent_date") || cairoDateToday();
  const agentTrendDays = Number(searchParams.get("agent_trend") || "7");
  const trendDays = agentTrendDays === 30 ? 30 : 7;

  const rangeStart = useMemo(
    () => cairoDateSubtract(agentDate, trendDays - 1),
    [agentDate, trendDays]
  );
  const rangeEnd = agentDate;

  const {
    data: summary,
    isLoading: isSummaryLoading,
  } = useQuery({
    queryKey: ["follow-up-summary", clientId, agentDate],
    queryFn: () => fetchFollowUpSummary(clientId, agentDate),
    enabled: Boolean(clientId),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const {
    data: rangeData,
    isLoading: isRangeLoading,
  } = useQuery({
    queryKey: ["follow-up-summary-range", clientId, rangeStart, rangeEnd],
    queryFn: () => fetchFollowUpSummaryRange(clientId, rangeStart, rangeEnd),
    enabled: Boolean(clientId),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const totals = summary?.totals ?? emptyFollowUpTotals();
  const leads = summary?.leads ?? [];
  const sources = summary?.sources ?? [];
  const hasSummary = Boolean(summary);

  const trends = useMemo(() => {
    const summaries = rangeData?.summaries ?? [];
    return summaries.map((item) => ({
      label: item.date,
      followups_sent: item.totals?.followups_sent ?? 0,
      units_shared: item.totals?.units_shared ?? 0,
    }));
  }, [rangeData]);

  const isLoading = isSummaryLoading || isRangeLoading;

  if (isLoading && !summary && !rangeData) {
    return (
      <div className="w-full p-2">
        <SectionSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <FollowUpAgentHeader sources={sources} hasSummary={hasSummary} />
      <FollowUpAgentKpiCards totals={totals} />

      {!hasSummary && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 text-sm text-gray-500 text-center">
          {translate("analytics.followUpAgent.no_activity")}
        </div>
      )}

      <FollowUpAgentTrendChart trends={trends} />
      <FollowUpAgentLeadsTable leads={leads} />
    </div>
  );
}
