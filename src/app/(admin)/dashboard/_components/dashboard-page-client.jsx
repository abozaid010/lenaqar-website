"use client";

import { AverageScoreProvider } from "@/context/average-score";
import { DashboardLeadsBulkProvider } from "@/context/dashboard-leads-bulk-context";
import DashbordFilter from "./dashbord-filter";
import DashboardSplitView from "./split-view/DashboardSplitView";
import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function DashboardPageClient({ appliedFilters }) {
  return (
    <AverageScoreProvider>
      <DashboardLeadsBulkProvider>
        <div className="relative z-20 shrink-0 p-4 bg-white rounded-lg shadow-md overflow-visible">
          <DashbordFilter appliedFilters={appliedFilters} compact />
        </div>

        <div className="mt-4 flex-1 min-h-0 flex flex-col">
          <Suspense
            fallback={
              <LoadingSpinner
                message="Loading leads..."
                containerClassName="flex items-center justify-center min-h-[400px]"
              />
            }
          >
            <DashboardSplitView />
          </Suspense>
        </div>
      </DashboardLeadsBulkProvider>
    </AverageScoreProvider>
  );
}
