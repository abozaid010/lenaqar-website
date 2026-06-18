"use client";

import EmptyStateVideo from "@/components/ui/empty-state-video";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 3000;

function useClientMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return isMounted;
}
import LeadRow from "./LeadRow";
import { useI18n } from "@/hooks/useI18n";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";

function ListSkeleton({ rows = 8 }) {
  return (
    <div className="animate-pulse space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded border border-gray-50" />
      ))}
    </div>
  );
}

export default function LeadsListPane({
  users,
  totalLoadedLeads = 0,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  error,
  refetch,
  selectedUserId,
  onSelectLead,
  data,
  isLeadSelected,
  onToggleLeadSelection,
  onToggleSelectAllVisible,
  hasBulkSelection = false,
}) {
  const { translate, common, property, localeUtils } = useI18n();
  const isMounted = useClientMounted();
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const showBulkCheckbox = isMounted && canShowBulkButton;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get("query") || "");
  const debounceTimer = useRef(null);
  const lastPushedQueryRef = useRef(searchParams.get("query") || "");
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const scrollRootRef = useRef(null);
  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const lastAutoFetchAtRef = useRef(0);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
    hasNextPageRef.current = hasNextPage;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const applySearch = useCallback(
    (raw) => {
      const next = (raw ?? "").trim();
      const current = searchParams.get("query") || "";
      if (current === next && lastPushedQueryRef.current === next) return;

      lastPushedQueryRef.current = next;
      const usp = new URLSearchParams(searchParams.toString());
      if (next) usp.set("query", next);
      else usp.delete("query");
      router.replace(`${window.location.pathname}?${usp.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    applySearch(searchInput);
  }, [applySearch, searchInput]);

  // Sync input only when the URL query changes externally (e.g. back/forward, filters).
  useEffect(() => {
    const urlQuery = searchParams.get("query") || "";
    if (urlQuery !== lastPushedQueryRef.current) {
      lastPushedQueryRef.current = urlQuery;
      setSearchInput(urlQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applySearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput, applySearch]);

  const appliedSearchQuery = (searchParams.get("query") || "").trim();
  const clientFilteredEmpty =
    Boolean(appliedSearchQuery) && users.length === 0 && totalLoadedLeads > 0;
  /** When false, list area still shows skeleton — no sentinel in DOM yet. */
  const initialListPaint = !(isLoading && !data);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (clientFilteredEmpty || !hasNextPage || !initialListPaint) return;

    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const throttleMs = 450;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasNextPageRef.current || isFetchingNextPageRef.current) return;
        const now = Date.now();
        if (now - lastAutoFetchAtRef.current < throttleMs) return;
        lastAutoFetchAtRef.current = now;
        fetchNextPageRef.current();
      },
      { root, threshold: 0.1, rootMargin: "80px" }
    );
    observerRef.current.observe(sentinel);
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [clientFilteredEmpty, hasNextPage, initialListPaint]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-red-600">
        <p>{error?.message || common.failedToLoadLeads}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-primary text-white rounded text-xs"
        >
          {common.retry}
        </button>
      </div>
    );
  }

  const showInitialLoading = isLoading && !data;
  const showNoSearchMatches =
    !showInitialLoading &&
    !isError &&
    users.length === 0 &&
    totalLoadedLeads > 0 &&
    appliedSearchQuery;

  return (
    <div className="flex flex-col min-h-0 h-full min-h-[320px] border-r border-gray-200 bg-white">
      <div className="p-2 border-b border-gray-100 shrink-0 space-y-2">
        {showBulkCheckbox && users.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                users.length > 0 &&
                users.every((u) => isLeadSelected?.(u.user_id))
              }
              ref={(el) => {
                if (!el) return;
                const someSelected = users.some((u) =>
                  isLeadSelected?.(u.user_id)
                );
                const allSelected =
                  users.length > 0 &&
                  users.every((u) => isLeadSelected?.(u.user_id));
                el.indeterminate = someSelected && !allSelected;
              }}
              onChange={() => onToggleSelectAllVisible?.()}
              className="h-4 w-4 accent-primary cursor-pointer"
            />
            <span>
              {hasBulkSelection
                ? translate(
                    "dashboardFilter.bulkWhatsapp.selectedLeads",
                    "Selected leads"
                  )
                : translate(
                    "dashboardFilter.bulkWhatsapp.selectAllVisible",
                    "Select all visible"
                  )}
            </span>
          </label>
        )}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder={translate("searchPlaceholder")}
              className="w-full h-[34px] pl-8 pr-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="shrink-0 h-[34px] px-3 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
          >
            {translate("common.search")}
          </button>
        </div>
      </div>

      <div
        ref={scrollRootRef}
        className="flex-1 min-h-0 overflow-y-auto"
        role="listbox"
        aria-label={common.leads}
      >
        {showInitialLoading ? (
          <ListSkeleton />
        ) : showNoSearchMatches ? (
          <>
            <div className="min-h-[120px] flex items-center justify-center p-4 text-center text-sm text-gray-600">
              {translate("common.noResultsFound")}
            </div>
            <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
            {isFetchingNextPage && (
              <div className="py-2 text-center text-xs text-gray-500">
                {common.loadingMore}
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="w-full py-1 text-xs text-primary border border-gray-200 rounded hover:bg-gray-50"
                >
                  {common.loadMore}
                </button>
              </div>
            )}
          </>
        ) : users.length === 0 ? (
          <div className="min-h-[200px] flex items-center justify-center p-2">
            <EmptyStateVideo variant="dashboard" autoPlay showControls loop />
          </div>
        ) : (
          <>
            {users.map((user) => (
              <LeadRow
                key={user.user_id}
                user={user}
                selected={selectedUserId === user.user_id}
                onSelect={onSelectLead}
                showBulkCheckbox={showBulkCheckbox}
                bulkSelected={isLeadSelected?.(user.user_id)}
                onToggleBulkSelection={onToggleLeadSelection}
              />
            ))}
            <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
            {isFetchingNextPage && (
              <div className="py-2 text-center text-xs text-gray-500">
                {common.loadingMore}
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="w-full py-1 text-xs text-primary border border-gray-200 rounded hover:bg-gray-50"
                >
                  {common.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
