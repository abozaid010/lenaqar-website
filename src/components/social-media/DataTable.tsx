"use client";

import type { ReactNode } from "react";

export function DataTable({
  columns,
  rows,
  onRowClick,
  empty,
}: {
  columns: { key: string; header: ReactNode; className?: string }[];
  rows: { key: string; cells: Record<string, ReactNode> }[];
  onRowClick?: (rowKey: string) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        {empty ?? "No results."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-[1]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-start text-xs font-semibold text-gray-600 px-4 py-3 border-b border-gray-200 whitespace-nowrap ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr
                key={r.key}
                className={`hover:bg-gray-50/70 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(r.key)}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-sm text-gray-800 align-top">
                    {r.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
