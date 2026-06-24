"use client";

import React from "react";
import { useI18n } from "@/hooks/useI18n";
import { KPI_KEYS } from "@/constants/follow-up-agent";

export default function FollowUpAgentKpiCards({ totals = {} }) {
  const { translate } = useI18n();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
      {KPI_KEYS.map((key) => (
        <div key={key} className="rounded-xl p-4 shadow-sm bg-white border border-transparent">
          <p className="text-xs text-gray-500 mb-1">
            {translate(`analytics.followUpAgent.kpi.${key}`)}
          </p>
          <p className="text-2xl font-bold text-primary">{totals[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
