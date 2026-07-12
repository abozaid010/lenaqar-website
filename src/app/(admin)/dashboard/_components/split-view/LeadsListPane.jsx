"use client";

import EmptyStateVideo from "@/components/ui/empty-state-video";
import { useI18n } from "@/hooks/useI18n";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useDashboardFilterPersistence } from "@/hooks/useDashboardFilterPersistence";
import {
  dashboardFiltersToQueryString,
  extractPersistableDashboardFilters,
  hasPersistableDashboardFilters,
} from "@/lib/dashboard-filters-storage";
import { ArrowRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LeadRow from "./LeadRow";

const SEARCH_DEBOUNCE_MS = 3000;

function useClientMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return isMounted;
}

function readFilterParam(params, key) {
  if (!params) return "";
  if (typeof params.get === "function") return params.get(key) || "";
  const value = params[key];
  return value == null || value === "" ? "" : String(value);
}

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
  /** Total matching leads when fully known (all pages loaded); null while more pages remain. */
  totalMatchingLeads = null,
  pageCount = 0,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  error,
  refetch,
  selectedUserId,
  onSelectLead,
  onCallLead,
  data,
  isLeadSelected,
  onToggleLeadSelection,
  onToggleSelectAllVisible,
  hasBulkSelection = false,
}) {
  const { translate, common, localeUtils } = useI18n();
  const isMounted = useClientMounted();
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const showBulkCheckbox = isMounted && canShowBulkButton;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { effectiveFilterParams } = useDashboardFilterPersistence();
  const initialQuery =
    searchParams.get("query") ||
    readFilterParam(effectiveFilterParams, "query") ||
    "";
  const [searchInput, setSearchInput] = useState(() => initialQuery);
  const debounceTimer = useRef(null);
  const lastPushedQueryRef = useRef(initialQuery);
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
      const currentFromUrl = searchParams.get("query") || "";
      const currentEffective = readFilterParam(effectiveFilterParams, "query").trim();
      const current = currentFromUrl || currentEffective;
      if (next === current && lastPushedQueryRef.current === next) return;

      lastPushedQueryRef.current = next;

      // Prefer live URL params; while restored filters hydrate, seed from effective filters
      // so we don't clobber action/author/dates with a query-only URL.
      const usp = hasPersistableDashboardFilters(searchParams)
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams(
            dashboardFiltersToQueryString(
              extractPersistableDashboardFilters(effectiveFilterParams),
            ),
          );

      if (next) usp.set("query", next);
      else usp.delete("query");

      const userId = searchParams.get("userId");
      if (userId) usp.set("userId", userId);

      const qs = usp.toString();
      router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname, {
        scroll: false,
      });
    },
    [router, searchParams, effectiveFilterParams]
  );

  const handleSearchSubmit = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    applySearch(searchInput);
  }, [applySearch, searchInput]);

  const handleClearSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchInput("");
    applySearch("");
  }, [applySearch]);

  const hasSearchText = searchInput.trim().length > 0;

  // Sync input when the URL query changes externally (e.g. back/forward, filters),
  // or when restored filters are applied before searchParams catch up.
  useEffect(() => {
    const urlQuery = searchParams.get("query") || "";
    const restoredQuery = readFilterParam(effectiveFilterParams, "query");
    const nextQuery = urlQuery || restoredQuery;
    if (nextQuery !== lastPushedQueryRef.current) {
      lastPushedQueryRef.current = nextQuery;
      setSearchInput(nextQuery);
    }
  }, [searchParams, effectiveFilterParams]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applySearch(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput, applySearch]);

  const appliedSearchQuery = (
    searchParams.get("query") ||
    readFilterParam(effectiveFilterParams, "query") ||
    ""
  ).trim();
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

  const loadedCount = totalLoadedLeads;
  const totalFromAPI = totalMatchingLeads;

  const loadedCountLabel = (() => {
    if (loadedCount <= 0 && !(totalFromAPI != null && !hasNextPage)) return "";

    const fmt = (n) => localeUtils.formatNumber(n);
    const count =
      totalFromAPI != null && !hasNextPage ? totalFromAPI : loadedCount;

    return translate(
      "dashboardFilter.bulkWhatsapp.loadedCount",
      "{loaded} loaded",
    ).replace("{loaded}", fmt(count));
  })();

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
    <div className="flex flex-col min-h-0 h-full min-h-[320px] lg:border-r border-chat-border chat-list-panel max-w-full lg:max-w-none">
      <div className="px-2 py-1.5 border-b border-chat-border shrink-0 bg-chat-panel-bg">
        <div className="flex items-center gap-1.5 min-w-0">
          {showBulkCheckbox && users.length > 0 ? (
            <label className="flex items-center shrink-0 cursor-pointer select-none">
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
                className="h-4 w-4 accent-primary cursor-pointer shrink-0"
                aria-label={
                  hasBulkSelection
                    ? translate(
                        "dashboardFilter.bulkWhatsapp.selectedLeads",
                        "Selected leads",
                      )
                    : translate(
                        "dashboardFilter.bulkWhatsapp.selectAllVisible",
                        "Select all visible",
                      )
                }
                title={
                  hasBulkSelection
                    ? translate(
                        "dashboardFilter.bulkWhatsapp.selectedLeads",
                        "Selected leads",
                      )
                    : translate(
                        "dashboardFilter.bulkWhatsapp.selectAllVisible",
                        "Select all visible",
                      )
                }
              />
            </label>
          ) : null}

          <div className="relative flex-1 min-w-0">
            {hasSearchText ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute start-1 top-1/2 -translate-y-1/2 z-[1] h-7 w-7 text-chat-text-muted rounded hover:bg-gray-100 hover:text-gray-700 transition-colors inline-flex items-center justify-center"
                title={translate("common.clear", "Clear")}
                aria-label={translate("common.clear", "Clear")}
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            ) : (
              <Search
                className="absolute start-2 top-1/2 -translate-y-1/2 w-4 h-4 text-chat-text-faint pointer-events-none z-[1]"
                aria-hidden
              />
            )}
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder={translate(
                "leadsSearchPlaceholder",
                "Search by name, phone, or company",
              )}
              className="chat-input-field w-full h-[34px] !rounded-md ps-8 pe-8 text-sm focus:!border-primary focus:!shadow-[0_0_0_1px] focus:!shadow-primary/25"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="absolute end-1 top-1/2 -translate-y-1/2 z-[1] h-7 w-7 text-primary rounded hover:bg-primary/10 transition-colors inline-flex items-center justify-center"
              title={translate("common.search")}
              aria-label={translate("common.search")}
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden />
            </button>
          </div>
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
            <div className="min-h-[120px] flex items-center justify-center p-4 text-center text-sm text-chat-text-muted">
              {translate("common.noResultsFound")}
            </div>
            <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
            {isFetchingNextPage && (
              <div className="py-2 text-center text-xs text-chat-text-faint">
                {common.loadingMore}
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="w-full py-1 text-xs text-[#25d366] border border-chat-border rounded hover:bg-chat-hover"
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
                onCall={onCallLead}
                showBulkCheckbox={showBulkCheckbox}
                bulkSelected={isLeadSelected?.(user.user_id)}
                onToggleBulkSelection={onToggleLeadSelection}
              />
            ))}
            <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
            {isFetchingNextPage && (
              <div className="py-2 text-center text-xs text-chat-text-faint">
                {common.loadingMore}
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="w-full py-1 text-xs text-[#25d366] border border-chat-border rounded hover:bg-chat-hover"
                >
                  {common.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {loadedCountLabel ? (
        <div className="px-2 py-1 border-t border-chat-border shrink-0 bg-chat-panel-bg">
          <span
            className="block text-[10px] leading-tight text-chat-text-faint tabular-nums text-end"
            aria-live="polite"
            title={loadedCountLabel}
          >
            {loadedCountLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
