"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useUsersInfiniteData } from "@/hooks/use-users-infinite-data";
import { useMatchingSession } from "@/hooks/use-matching-session";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useModuleActions } from "@/hooks/useModuleActions";
import { buildDashboardFilterKey } from "@/utils/dashboard-filter-key";
import { isValidDashboardDateRange } from "@/utils/dashboardDate";
import toast from "react-hot-toast";
import MatchingAudienceFilters, {
  getDefaultMatchingFilters,
} from "./_components/matching-audience-filters";
import MatchingLeadsList from "./_components/matching-leads-list";
import MatchingResultsSection from "./_components/matching-results-section";
import MatchingWhatsappPreviewDialog from "./_components/matching-whatsapp-preview-dialog";
import BulkLeadActionDialog from "@/app/(admin)/dashboard/_components/split-view/BulkLeadActionDialog";

const MATCHING_PAGE_LIMIT = 30;

export default function MatchingPageClient() {
  const { translate } = useI18n();
  const { canView, isReady: conversationReady } = useModuleActions("conversation");
  const {
    canUseAutomation,
    isReady: whatsappReady,
  } = useWhatsappBulkAccess();
  const canBulkWhatsapp = canUseAutomation;

  const [filters, setFilters] = useState(getDefaultMatchingFilters);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResults, setPreviewResults] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [successfulLeads, setSuccessfulLeads] = useState([]);

  const session = useMatchingSession();

  const filterKey = useMemo(() => {
    const params = {
      limit: MATCHING_PAGE_LIMIT,
    };
    if (filters.owner_type) params.owner_type = filters.owner_type;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.action) params.action = filters.action;
    if (filters.query) params.query = filters.query;
    return buildDashboardFilterKey(params);
  }, [filters]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUsersInfiniteData(filterKey);

  const loadedLeads = useMemo(() => {
    const pages = data?.pages || [];
    return pages.flatMap((page) => page?.users || []);
  }, [data]);

  const dateValid = isValidDashboardDateRange(
    filters.start_date,
    filters.end_date,
  );

  const isMatching = session.phase === "matching";
  const isSending = session.phase === "sending";
  const hasResults = session.phase === "review" || session.phase === "sending";

  const handleFiltersChange = (next) => {
    setFilters(next);
  };

  const handleFindMatches = async () => {
    if (!loadedLeads.length || isMatching) return;
    await session.runMatching(loadedLeads);
  };

  const openPreviewForResults = (results) => {
    if (!results?.length) {
      toast.error(translate("matching.empty.noRecommendations"));
      return;
    }
    setPreviewResults(results);
    setPreviewOpen(true);
  };

  const handleSendClick = () => {
    openPreviewForResults(session.eligibleForSend);
  };

  const handleCardSendWhatsapp = (result) => {
    openPreviewForResults(result ? [result] : []);
  };

  const handleSend = async ({
    selectedAccount,
    useDeepLink,
    draftMessages,
    deepLinkPromise,
  }) => {
    // Snapshot before closing — deep-link closes the dialog immediately so the
    // UI is not frozen during N×5s paced tab navigation.
    const targetsSnapshot = previewResults;
    if (useDeepLink) {
      setPreviewOpen(false);
      setPreviewResults([]);
    }

    const result = await session.sendRecommendations({
      selectedAccount,
      useDeepLink,
      draftMessages,
      translate,
      targetsOverride: targetsSnapshot,
      deepLinkPromise,
    });

    if (!useDeepLink) {
      setPreviewOpen(false);
      setPreviewResults([]);
    }

    // Deep-link path already toasts via reportWhatsappDeepLinkResult.
    if (result.method !== "deeplink") {
      const successKey =
        result.failed > 0
          ? "matching.send.successWithErrors"
          : "matching.send.success";
      toast.success(
        translate(successKey)
          .replace("{count}", String(result.sent))
          .replace("{errors}", String(result.failed)),
      );
    }

    if (result.successfulLeads?.length > 0) {
      setSuccessfulLeads(result.successfulLeads);
      setBulkActionOpen(true);
    }
  };

  if (conversationReady && !canView) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          {translate("common.unauthorized", "You do not have access to this page.")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {translate("matching.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {translate("matching.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleFindMatches}
            disabled={
              !loadedLeads.length || isMatching || isSending || !dateValid
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {translate("matching.actions.findMatches")}
          </button>
          {whatsappReady && canBulkWhatsapp && hasResults && (
            <button
              type="button"
              onClick={handleSendClick}
              disabled={
                isMatching ||
                isSending ||
                session.eligibleForSend.length === 0
              }
              className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
            >
              {translate("matching.actions.sendRecommendations")}
            </button>
          )}
        </div>
      </div>

      <MatchingAudienceFilters
        filters={filters}
        onChange={handleFiltersChange}
      />

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.7fr)]">
        <div className="min-w-0">
          <MatchingLeadsList
            leads={loadedLeads}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={Boolean(hasNextPage)}
            onLoadMore={() => fetchNextPage()}
          />
        </div>

        <div className="min-w-0">
          <MatchingResultsSection
            phase={session.phase}
            progress={session.progress}
            results={session.results}
            onDismissUnit={session.dismissRecommendedUnit}
            canSendWhatsapp={whatsappReady && canBulkWhatsapp}
            onSendWhatsapp={handleCardSendWhatsapp}
            sending={isSending}
          />
        </div>
      </div>

      <MatchingWhatsappPreviewDialog
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewResults([]);
        }}
        eligibleResults={previewResults}
        getRecommendedUnits={session.getRecommendedUnits}
        onDismissUnit={session.dismissRecommendedUnit}
        onSend={handleSend}
        sending={isSending}
      />

      <BulkLeadActionDialog
        isOpen={bulkActionOpen}
        onClose={() => {
          setBulkActionOpen(false);
          setSuccessfulLeads([]);
        }}
        selectedLeads={successfulLeads}
        onSuccess={() => {
          setBulkActionOpen(false);
          setSuccessfulLeads([]);
        }}
      />
    </div>
  );
}
