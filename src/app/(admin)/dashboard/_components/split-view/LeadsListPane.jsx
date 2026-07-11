"use client";

import EmptyStateVideo from "@/components/ui/empty-state-video";
import { useI18n } from "@/hooks/useI18n";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { ArrowRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LeadRow from "./LeadRow";

const SEARCH_DEBOUNCE_MS = 3000;
/** Fraction of row height that must intersect the scroll root to count as visible. */
const VISIBLE_ROW_THRESHOLD = 0.15;

function useClientMounted() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return isMounted;
}

/**
 * Synchronously count rows intersecting the scroll root (avoids IO flash to 0 on reattach).
 * @param {Element} root
 * @param {NodeListOf<Element> | Element[]} rows
 */
function countIntersectingRows(root, rows) {
  const rootRect = root.getBoundingClientRect();
  if (rootRect.height <= 0) return 0;
  let n = 0;
  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (rect.height <= 0) continue;
    const overlap =
      Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top);
    if (overlap > rect.height * VISIBLE_ROW_THRESHOLD) n += 1;
  }
  return n;
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
  const [searchInput, setSearchInput] = useState(() => searchParams.get("query") || "");
  const debounceTimer = useRef(null);
  const lastPushedQueryRef = useRef(searchParams.get("query") || "");
  const observerRef = useRef(null);
  const visibleRowsObserverRef = useRef(null);
  const visibleRowIdsRef = useRef(new Set());
  const sentinelRef = useRef(null);
  const scrollRootRef = useRef(null);
  const [visibleOnScreenCount, setVisibleOnScreenCount] = useState(0);
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

  const handleClearSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchInput("");
    applySearch("");
  }, [applySearch]);

  const hasSearchText = searchInput.trim().length > 0;

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

  useEffect(() => {
    visibleRowsObserverRef.current?.disconnect();
    visibleRowsObserverRef.current = null;
    visibleRowIdsRef.current = new Set();

    if (!initialListPaint || users.length === 0) {
      setVisibleOnScreenCount(0);
      return;
    }

    const root = scrollRootRef.current;
    if (!root) {
      setVisibleOnScreenCount(0);
      return;
    }

    const rows = root.querySelectorAll("[data-user-id]");
    if (!rows.length) {
      setVisibleOnScreenCount(0);
      return;
    }

    const syncVisibleCount = () => {
      setVisibleOnScreenCount(visibleRowIdsRef.current.size);
    };

    // Seed from geometry so the label never flashes 0 when the observer reattaches
    // after infinite-scroll / filter updates (IO callbacks are async).
    const rootRect = root.getBoundingClientRect();
    for (const row of rows) {
      const id = row.getAttribute("data-user-id");
      if (!id) continue;
      const rect = row.getBoundingClientRect();
      const overlap =
        Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top);
      if (rect.height > 0 && overlap > rect.height * VISIBLE_ROW_THRESHOLD) {
        visibleRowIdsRef.current.add(id);
      }
    }
    setVisibleOnScreenCount(countIntersectingRows(root, rows));

    visibleRowsObserverRef.current = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-user-id");
          if (!id) continue;
          if (entry.isIntersecting) {
            if (!visibleRowIdsRef.current.has(id)) {
              visibleRowIdsRef.current.add(id);
              changed = true;
            }
          } else if (visibleRowIdsRef.current.delete(id)) {
            changed = true;
          }
        }
        if (changed) syncVisibleCount();
      },
      { root, threshold: VISIBLE_ROW_THRESHOLD }
    );

    rows.forEach((row) => visibleRowsObserverRef.current.observe(row));

    return () => {
      visibleRowsObserverRef.current?.disconnect();
      visibleRowsObserverRef.current = null;
      visibleRowIdsRef.current = new Set();
    };
  }, [users, initialListPaint]);

  const loadedCount = totalLoadedLeads;
  const renderedCount = users.length;
  const visibleCount = visibleOnScreenCount;
  const totalFromAPI = totalMatchingLeads;
  const filters = searchParams.toString();
  const search = appliedSearchQuery;

  if (typeof window !== "undefined") {
    console.log("[LeadsListPane Counts]", {
      totalFromAPI,
      loadedCount,
      renderedCount,
      visibleCount,
      pageCount,
      hasNextPage,
      filters,
      search,
    });
  }

  const visibleCountLabel = (() => {
    if (renderedCount === 0) return "";

    const fmt = (n) => localeUtils.formatNumber(n);

    // messages/v2/all has no grand-total field. Once every page is loaded,
    // unique fetched leads === total matching for the current filters.
    if (totalFromAPI != null && !hasNextPage) {
      return translate(
        "dashboardFilter.bulkWhatsapp.visibleOnScreenTotal",
        "{visible} visible · {total} total"
      )
        .replace("{visible}", fmt(visibleCount))
        .replace("{total}", fmt(totalFromAPI));
    }

    return translate(
      "dashboardFilter.bulkWhatsapp.visibleOnScreenLoaded",
      "{visible} visible · {loaded} loaded"
    )
      .replace("{visible}", fmt(visibleCount))
      .replace("{loaded}", fmt(loadedCount));
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
      <div className="p-2 border-b border-chat-border shrink-0 space-y-2 bg-chat-panel-bg">
        {(showBulkCheckbox && users.length > 0) || visibleCountLabel ? (
          <div className="flex items-center justify-between gap-2 min-h-[20px]">
            {showBulkCheckbox && users.length > 0 ? (
              <label className="flex items-center gap-2 text-xs text-chat-text-muted cursor-pointer select-none min-w-0">
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
                />
                <span className="truncate">
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
            ) : (
              <span aria-hidden className="shrink-0" />
            )}
            {visibleCountLabel ? (
              <span
                className="text-[10px] leading-tight text-chat-text-faint shrink-0 tabular-nums"
                aria-live="polite"
              >
                {visibleCountLabel}
              </span>
            ) : null}
          </div>
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
    </div>
  );
}
