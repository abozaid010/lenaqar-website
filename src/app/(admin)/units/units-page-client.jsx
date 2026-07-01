"use client";

import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { UnitsBulkSelectionProvider } from "@/context/units-bulk-selection-context";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function UnitsPageClient({ searchParams, clientId, initialUnitsData }) {
  return (
    <UnitsBulkSelectionProvider clientId={clientId}>
      <div className="h-full flex flex-col min-h-0">
        <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
          {/* Units list (main) */}
          <div className="min-h-0 flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <UnitsPageQueryOptimized
                searchParams={searchParams}
                clientId={clientId}
                initialUnitsData={initialUnitsData}
              />
            </Suspense>
          </div>

          {/* Filters (end side on desktop) */}
          <div className="lg:w-[360px] shrink-0">
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
