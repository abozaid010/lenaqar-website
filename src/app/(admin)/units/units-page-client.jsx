"use client";

import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { UnitsBulkSelectionProvider } from "@/context/units-bulk-selection-context";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function UnitsPageClient({ searchParams, clientId }) {
  return (
    <UnitsBulkSelectionProvider clientId={clientId}>
      <div className="h-full flex flex-col">
        <Suspense fallback={<div className="h-16 rounded-lg bg-gray-100 animate-pulse" />}>
          <UnitsFilter clientId={clientId} isPublic={false} />
        </Suspense>

        <div className="mt-4">
          <Suspense fallback={<LoadingSpinner />}>
            <UnitsPageQueryOptimized
              searchParams={searchParams}
              clientId={clientId}
            />
          </Suspense>
        </div>
      </div>
    </UnitsBulkSelectionProvider>
  );
}
