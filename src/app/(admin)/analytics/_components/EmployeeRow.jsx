"use client";

import React, { memo, useMemo, useState } from "react";
import EmployeeDetails from "./EmployeeDetails";

function EmployeeRowComponent({ employee, isTop, isLowest }) {
  const [open, setOpen] = useState(false);
  const score = Math.max(0, Math.min(100, Number(employee.normalized_score || 0)));
  const scoreColor = useMemo(() => {
    if (score > 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-400";
    return "bg-red-500";
  }, [score]);

  const rowBg = isTop ? "bg-emerald-50" : isLowest ? "bg-red-50" : "bg-white";

  return (
    <>
      <tr className={`${rowBg} border-b cursor-pointer`} onClick={() => setOpen((prev) => !prev)}>
        <td className="p-3 text-sm font-medium">{employee.name || "-"}</td>
        <td className="p-3 text-sm">{employee.actions || 0}</td>
        <td className="p-3 text-sm">{employee.calls || 0}</td>
        <td className="p-3 text-sm">{employee.meetings_rate || 0}%</td>
        <td className="p-3 text-sm">{employee.units || 0}</td>
        <td className="p-3 text-sm">{employee.active_days || 0}</td>
        <td className="p-3 text-sm min-w-[180px]">
          <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
            <div className={`${scoreColor} h-2 rounded-full`} style={{ width: `${score}%` }} />
          </div>
          <span className="text-xs text-gray-600">{score}%</span>
        </td>
      </tr>
      {open && (
        <tr className="border-b">
          <td colSpan={7} className="p-3">
            <EmployeeDetails employee={employee} />
          </td>
        </tr>
      )}
    </>
  );
}

const EmployeeRow = memo(EmployeeRowComponent);

export default EmployeeRow;
