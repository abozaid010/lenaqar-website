"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchManagerAnalytics } from "@/utils/api";
import { useI18n } from "@/hooks/useI18n";
import FiltersBar from "./FiltersBar";
import SummaryCards from "./SummaryCards";
import TrendsChart from "./TrendsChart";
import EmployeesTable from "./EmployeesTable";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl h-24" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl h-72" />
      <div className="bg-white rounded-xl h-72" />
    </div>
  );
}

export default function AnalyticsDashboard({ initialData = {} }) {
  const searchParams = useSearchParams();
  const { translate } = useI18n();

  const params = useMemo(() => {
    const months = searchParams.get("months") || "1";
    const employeeId = searchParams.get("employee_id") || undefined;
    const range = searchParams.get("range") || "daily";
    return {
      months,
      range,
      ...(employeeId ? { employee_id: employeeId } : {}),
    };
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", params],
    queryFn: () => fetchManagerAnalytics(params),
    initialData,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const summary = data?.summary || {};
  const trends = data?.trends || [];
  const employees = data?.employees || [];

  if (isLoading) return <DashboardSkeleton />;

  if (!employees.length && !trends.length) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <p className="text-lg font-semibold mb-2">{translate("analytics.no_data_available")}</p>
        <p className="text-sm text-gray-500">{translate("analytics.start_tracking_activity")}</p>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <h2 className="text-2xl font-bold mb-1">{translate("analytics.dashboard_title")}</h2>
      <p className="text-gray-600 mb-4">{translate("analytics.dashboard_description")}</p>

      <FiltersBar employees={employees} />
      <SummaryCards summary={summary} />
      <TrendsChart trends={trends} />
      <EmployeesTable employees={employees} />
    </div>
  );
}
