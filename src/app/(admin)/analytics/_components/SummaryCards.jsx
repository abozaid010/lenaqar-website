"use client";

import React from "react";
import { useI18n } from "@/hooks/useI18n";

const KPI_KEYS = [
  "total_actions",
  "total_units_touched",
  "avg_actions_per_employee",
  "top_performer",
  "team_size",
];

export default function SummaryCards({ summary = {} }) {
  const { translate } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
      {KPI_KEYS.map((key) => {
        const isTopPerformer = key === "top_performer";
        const value = summary[key];
        return (
          <div
            key={key}
            className={`rounded-xl p-4 shadow-sm bg-white border ${
              isTopPerformer ? "border-emerald-300" : "border-transparent"
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">{translate(`analytics.${key}`)}</p>
            <p className="text-2xl font-bold text-[#030250]">
              {value ?? (isTopPerformer ? "-" : "0")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
