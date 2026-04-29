"use client";

import React, { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";

const RANGE_OPTIONS = ["daily", "weekly", "monthly"];

export default function FiltersBar({ employees = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translate } = useI18n();
  const [isPending, startTransition] = useTransition();

  const selectedMonths = searchParams.get("months") || "1";
  const selectedEmployee = searchParams.get("employee_id") || "all";
  const selectedRange = searchParams.get("range") || "daily";

  const employeeOptions = useMemo(() => {
    return employees.map((employee) => ({
      id: String(employee.id ?? employee.employee_id ?? ""),
      name: employee.name || employee.employee_name || translate("analytics.unknown_employee"),
    }));
  }, [employees, translate]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">{translate("analytics.months")}</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedMonths}
            onChange={(event) => updateParam("months", event.target.value)}
            disabled={isPending}
          >
            {Array.from({ length: 12 }).map((_, index) => {
              const value = String(index + 1);
              return (
                <option key={value} value={value}>
                  {value === "1"
                    ? translate("analytics.last_month")
                    : translate("analytics.last_months", { count: value })}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">{translate("analytics.employee")}</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedEmployee}
            onChange={(event) => updateParam("employee_id", event.target.value)}
            disabled={isPending}
          >
            <option value="all">{translate("analytics.all_employees")}</option>
            {employeeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">{translate("analytics.range")}</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedRange}
            onChange={(event) => updateParam("range", event.target.value)}
            disabled={isPending}
          >
            {RANGE_OPTIONS.map((range) => (
              <option key={range} value={range}>
                {translate(`analytics.range_${range}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
