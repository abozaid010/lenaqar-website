"use client";

import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/hooks/useI18n";

export default function FollowUpAgentTrendChart({ trends = [] }) {
  const { translate } = useI18n();

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">
        {translate("analytics.followUpAgent.trend_title")}
      </h3>
      <div className="w-full h-[320px]">
        {trends.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            {translate("analytics.followUpAgent.no_trend_data")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="followups_sent"
                name={translate("analytics.followUpAgent.kpi.followups_sent")}
                stroke="#030250"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="units_shared"
                name={translate("analytics.followUpAgent.kpi.units_shared")}
                stroke="#5d3dd5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
