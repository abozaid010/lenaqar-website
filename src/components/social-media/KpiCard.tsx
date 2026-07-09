"use client";

import type { ReactNode } from "react";

export function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string | null;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-600 truncate">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-gray-500 truncate">{hint}</div>
          ) : null}
        </div>
        <div className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-2 text-gray-700 transition-colors group-hover:bg-gray-100">
          {icon}
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}

