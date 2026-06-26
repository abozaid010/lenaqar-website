"use client";

import { AverageScoreProvider } from "@/context/average-score";
import { DashboardLeadsBulkProvider } from "@/context/dashboard-leads-bulk-context";
import { useI18n } from "@/hooks/useI18n";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { useOpenwaSessionsStatus } from "@/hooks/useOpenwaSessionsStatus";
import {
  isOpenwaProvider,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";
import DashbordFilter from "./dashbord-filter";
import DashboardSplitView from "./split-view/DashboardSplitView";
import OpenwaConnectionDialog from "./OpenwaConnectionDialog";
import { MessageCircle, SlidersHorizontal, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function DashboardPageClient({ appliedFilters }) {
  const { translate } = useI18n();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showOpenwaDialog, setShowOpenwaDialog] = useState(false);
  const hasPromptedOpenwaRef = useRef(false);
  const { data: messagingConfig, isSuccess: isMessagingReady } =
    useMessagingProviderConfig();

  const openwaProfileAccounts = useMemo(() => {
    const accounts = messagingConfig?.accounts ?? [];
    return accounts
      .filter((account) => isOpenwaProvider(account.platform))
      .map((account) => {
        const whatsapp_number = resolveSenderPhoneNumber(account) || "";
        return {
          session_id:
            account.openwa_session_id?.trim() ||
            (whatsapp_number ? `phone:${whatsapp_number}` : "unknown"),
          whatsapp_number,
          connected: false,
          status: null,
          qrImage: null,
          error: null,
        };
      });
  }, [messagingConfig]);

  const hasOpenwaLinkedAccounts = openwaProfileAccounts.length > 0;

  const openwaStatusQuery = useOpenwaSessionsStatus({
    enabled: hasOpenwaLinkedAccounts,
    pollWhileDisconnected: showOpenwaDialog,
  });

  useEffect(() => {
    if (hasPromptedOpenwaRef.current) return;
    if (!isMessagingReady) return;

    hasPromptedOpenwaRef.current = true;
    if (hasOpenwaLinkedAccounts) {
      setShowOpenwaDialog(true);
    }
  }, [hasOpenwaLinkedAccounts, isMessagingReady]);

  const filterPanelTitle = translate("dashboardFilter.panel.title");
  const filterPanelOpenLabel = translate("dashboardFilter.panel.open");
  const filterPanelCloseLabel = translate("dashboardFilter.panel.close");
  const openwaStatusLabel = translate(
    "openwaConnection.openStatus",
    "WhatsApp connection"
  );

  useEffect(() => {
    if (!isFiltersOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsFiltersOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFiltersOpen]);

  return (
    <AverageScoreProvider>
      <DashboardLeadsBulkProvider>
        <div className="relative flex-1 min-h-0 flex flex-col">
          {hasOpenwaLinkedAccounts ? (
            <button
              type="button"
              onClick={() => setShowOpenwaDialog(true)}
              className="no-print absolute start-3 top-3 z-30 inline-flex items-center justify-center gap-1.5 h-9 min-h-9 px-3 rounded-md border border-primary/20 bg-white text-sm font-medium text-primary shadow-sm hover:bg-primary/5 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              aria-label={openwaStatusLabel}
            >
              <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
              <span>{openwaStatusLabel}</span>
            </button>
          ) : null}

          {!isFiltersOpen ? (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              aria-expanded={false}
              className="no-print absolute end-3 top-3 z-30 inline-flex items-center justify-center gap-1.5 h-9 min-h-9 px-3 rounded-md bg-primary text-sm font-medium text-white shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              aria-label={filterPanelOpenLabel}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden />
              <span>{filterPanelTitle}</span>
            </button>
          ) : null}

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
                appliedFilters={appliedFilters}
                compact
                panel
              />
            </div>
          </aside>

          <div className="flex-1 min-h-0 flex flex-col">
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
        </div>
        <OpenwaConnectionDialog
          isOpen={showOpenwaDialog}
          onClose={() => setShowOpenwaDialog(false)}
          statusQuery={openwaStatusQuery}
          fallbackSessions={openwaProfileAccounts}
        />
      </DashboardLeadsBulkProvider>
    </AverageScoreProvider>
  );
}
