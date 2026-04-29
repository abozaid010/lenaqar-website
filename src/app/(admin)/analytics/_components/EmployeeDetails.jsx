"use client";

import React from "react";
import { useI18n } from "@/hooks/useI18n";

export default function EmployeeDetails({ employee }) {
  const { translate } = useI18n();
  const actionsByType = employee?.actions_by_type || {};

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">{translate("analytics.consistency_rate")}</p>
          <p className="text-sm font-semibold">{`${employee?.consistency_rate || 0}%`}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{translate("analytics.avg_actions_per_unit")}</p>
          <p className="text-sm font-semibold">{employee?.avg_actions_per_unit || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{translate("analytics.actions_per_active_day")}</p>
          <p className="text-sm font-semibold">{`${employee?.actions_per_active_day || 0}/${translate("analytics.day_short")}`}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">{translate("analytics.actions_by_type")}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.keys(actionsByType).length === 0 ? (
            <p className="text-sm text-gray-500">{translate("analytics.no_actions_breakdown")}</p>
          ) : (
            Object.entries(actionsByType).map(([key, value]) => (
              <div key={key} className="bg-white rounded border px-2 py-1 text-xs">
                <span className="text-gray-500">{key}</span>: <span className="font-semibold">{value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
