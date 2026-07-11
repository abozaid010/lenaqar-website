"use client";

import OpenwaConnectionAccess from "@/components/whatsapp/OpenwaConnectionAccess";
import { AverageScoreProvider } from "@/context/average-score";
import { DashboardLeadsBulkProvider } from "@/context/dashboard-leads-bulk-context";
import { useI18n } from "@/hooks/useI18n";
import {
  DashboardFilterPersistenceProvider,
  useDashboardFilterPersistence,
} from "@/hooks/useDashboardFilterPersistence";
import DashbordFilter from "./dashbord-filter";
import DashboardSplitView from "./split-view/DashboardSplitView";
import DashboardSelectionBar from "./chrome/DashboardSelectionBar";
import AddLeadDialog from "@/components/ui/add-lead-dialog";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { SlidersHorizontal, UserPlus, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

function DashboardPageContent() {
  const { translate } = useI18n();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const { isReady, bootAppliedFilters, resetPersistedFilters } =
    useDashboardFilterPersistence();
  const clientId = LenaCookiesManager.getClientId();

  const filterPanelTitle = translate("dashboardFilter.panel.title");
  const filterPanelOpenLabel = translate("dashboardFilter.panel.open");
  const filterPanelCloseLabel = translate("dashboardFilter.panel.close");

  useEffect(() => {
    if (!isFiltersOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsFiltersOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFiltersOpen]);

  if (!isReady || bootAppliedFilters == null) {
    return (
      <LoadingSpinner
        message="Loading..."
        containerClassName="flex items-center justify-center min-h-[400px]"
      />
    );
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col gap-1">
      <div className="no-print flex items-center gap-2 shrink-0 min-h-9">
        <button
          type="button"
          onClick={() => setIsAddLeadOpen(true)}
          aria-label={translate("dashboardFilter.ADD")}
          className="inline-flex items-center justify-center gap-1.5 h-9 min-h-9 px-2.5 sm:px-3 rounded-md bg-primary text-sm font-medium text-white shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <UserPlus className="w-4 h-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">
            {translate("dashboardFilter.ADD")}
          </span>
        </button>

        <DashboardSelectionBar />

        <button
          type="button"
          onClick={() => setIsFiltersOpen(true)}
          aria-expanded={isFiltersOpen}
          className="ms-auto inline-flex items-center justify-center gap-1.5 h-9 min-h-9 px-2.5 sm:px-3 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={filterPanelOpenLabel}
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{filterPanelTitle}</span>
        </button>
      </div>

      {isFiltersOpen ? (
        <button
          type="button"
          aria-label={filterPanelCloseLabel}
          className="no-print absolute inset-0 z-40 bg-black/20"
          onClick={() => setIsFiltersOpen(false)}
        />
      ) : null}

      <aside
        className={`no-print fixed lg:absolute inset-y-0 end-0 z-50 flex w-[min(100%,18rem)] sm:w-72 flex-col border-s border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out ${
          isFiltersOpen
            ? "translate-x-0"
            : "translate-x-full rtl:-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!isFiltersOpen}
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {filterPanelTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsFiltersOpen(false)}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={filterPanelCloseLabel}
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
          <DashbordFilter
            appliedFilters={bootAppliedFilters}
            compact
            panel
            hideAddLead
            onResetFilters={resetPersistedFilters}
          />
        </div>
      </aside>

      <div className="flex-1 min-h-0 flex flex-col">
        <DashboardSplitView />
      </div>

      <AddLeadDialog
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        clientId={clientId}
      />
      <OpenwaConnectionAccess autoOpenOnMount showButton={false} />
    </div>
  );
}

export default function DashboardPageClient({ appliedFilters }) {
  return (
    <AverageScoreProvider>
      <DashboardLeadsBulkProvider>
        <Suspense
          fallback={
            <LoadingSpinner
              message="Loading leads..."
              containerClassName="flex items-center justify-center min-h-[400px]"
            />
          }
        >
          <DashboardFilterPersistenceProvider
            serverAppliedFilters={appliedFilters}
          >
            <DashboardPageContent />
          </DashboardFilterPersistenceProvider>
        </Suspense>
      </DashboardLeadsBulkProvider>
    </AverageScoreProvider>
  );
}
