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

export default function TrendsChart({ trends = [] }) {
  const { translate } = useI18n();

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">{translate("analytics.trends")}</h3>
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="actions"
              name={translate("analytics.actions")}
              stroke="#030250"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="units"
              name={translate("analytics.units")}
              stroke="#5d3dd5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
