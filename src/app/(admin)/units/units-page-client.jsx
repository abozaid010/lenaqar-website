"use client";

import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { UnitsBulkSelectionProvider } from "@/context/units-bulk-selection-context";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function UnitsPageClient({ searchParams, clientId, initialUnitsData }) {
  return (
    <UnitsBulkSelectionProvider clientId={clientId}>
      {/*
        Avoid h-full + flex-1 collapse on mobile: when filters sit in the same
        column as the list, a constrained height parent can shrink the list to 0
        and paint unit cards under the filter panel.
      */}
      <div className="flex flex-col min-w-0 w-full">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 min-w-0 w-full">
          {/* Units list — full width on mobile; filters sit above via order */}
          <div className="min-w-0 flex-1 order-2 lg:order-1">
            <Suspense fallback={<LoadingSpinner />}>
              <UnitsPageQueryOptimized
                searchParams={searchParams}
                clientId={clientId}
                initialUnitsData={initialUnitsData}
              />
            </Suspense>
          </div>

          {/* Filters: compact bar + sheet on mobile; sticky sidebar on desktop */}
          <div className="w-full lg:w-[360px] shrink-0 order-1 lg:order-2 min-w-0">
            <div className="lg:sticky lg:top-3">
              <Suspense
                fallback={<div className="h-16 rounded-lg bg-gray-100 animate-pulse" />}
              >
                <UnitsFilter clientId={clientId} isPublic={false} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </UnitsBulkSelectionProvider>
  );
}
