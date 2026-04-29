"use client";

import React, { useMemo, useState } from "react";
import EmployeeRow from "./EmployeeRow";
import { useI18n } from "@/hooks/useI18n";

const COLUMNS = ["name", "actions", "calls", "meetings_rate", "units", "active_days", "normalized_score"];

export default function EmployeesTable({ employees = [] }) {
  const { translate } = useI18n();
  const [sortBy, setSortBy] = useState("normalized_score");
  const [direction, setDirection] = useState("desc");

  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      const aValue = a?.[sortBy] ?? 0;
      const bValue = b?.[sortBy] ?? 0;
      if (typeof aValue === "string" || typeof bValue === "string") {
        const result = String(aValue).localeCompare(String(bValue));
        return direction === "asc" ? result : -result;
      }
      const result = Number(aValue) - Number(bValue);
      return direction === "asc" ? result : -result;
    });
    return list;
  }, [employees, sortBy, direction]);

  const topEmployeeId = useMemo(() => {
    if (!sortedEmployees.length) return null;
    return [...sortedEmployees].sort(
      (a, b) => Number(b.normalized_score || 0) - Number(a.normalized_score || 0)
    )[0]?.id;
  }, [sortedEmployees]);

  const lowestEmployeeId = useMemo(() => {
    if (!sortedEmployees.length) return null;
    return [...sortedEmployees].sort(
      (a, b) => Number(a.normalized_score || 0) - Number(b.normalized_score || 0)
    )[0]?.id;
  }, [sortedEmployees]);

  const onSort = (column) => {
    if (sortBy === column) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setDirection("desc");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">{translate("analytics.employees_performance")}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  onClick={() => onSort(column)}
                  className="p-3 text-start text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                >
                  {translate(`analytics.col_${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((employee) => (
              <EmployeeRow
                key={employee.id || employee.employee_id || employee.name}
                employee={employee}
                isTop={(employee.id || employee.employee_id) === topEmployeeId}
                isLowest={(employee.id || employee.employee_id) === lowestEmployeeId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
