"use client";

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="mt-3 h-7 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 h-24" />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

