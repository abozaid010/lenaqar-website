"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardSummarySection from "./DashboardSummarySection";
import {
  fetchLegacyMonthData,
  fetchLegacyUserAnalytics,
  fetchManagerAnalytics,
} from "@/utils/api";

function SectionSkeleton({ height = "h-64" }) {
  return <div className={`w-full rounded-xl bg-white shadow-sm animate-pulse ${height}`} />;
}

const Analytics = dynamic(() => import("../_component/Analtics"), {
  ssr: false,
  loading: () => <SectionSkeleton height="h-[520px]" />,
});

const AnalyticsDashboard = dynamic(() => import("./AnalyticsDashboard"), {
  ssr: false,
  loading: () => <SectionSkeleton height="h-[520px]" />,
});

const FollowUpAgentSection = dynamic(
  () => import("./follow-up-agent/FollowUpAgentSection"),
  {
    ssr: false,
    loading: () => <SectionSkeleton height="h-[520px]" />,
  }
);

export default function AnalyticsPageClient() {
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    return {
      months: searchParams.get("months") || "1",
      range: searchParams.get("range") || "daily",
      employee_id: searchParams.get("employee_id") || undefined,
    };
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-page", params],
    queryFn: async () => {
      const [legacyMonth, legacyUsers, managerStats] = await Promise.all([
        fetchLegacyMonthData(params),
        fetchLegacyUserAnalytics(10),
        fetchManagerAnalytics(params),
      ]);
      return { legacyMonth, legacyUsers, managerStats };
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <DashboardSummarySection />
        <SectionSkeleton height="h-[520px]" />
        <SectionSkeleton height="h-[520px]" />
      </div>
    );
  }

  return (
    <>
      <DashboardSummarySection />
      <div>
        <Analytics
          data={data?.legacyUsers || {}}
          datamonth={data?.legacyMonth || []}
          appliedFilters={params}
        />
      </div>
      <div className="mt-4">
        <AnalyticsDashboard initialData={data?.managerStats || {}} />
      </div>
      <div className="mt-4">
        <FollowUpAgentSection />
      </div>
    </>
  );
}
