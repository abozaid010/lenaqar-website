"use client";

import EmptyStateVideo from "@/components/ui/empty-state-video";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LeadRow from "./LeadRow";
import { useI18n } from "@/hooks/useI18n";

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
}) {
  const { t, translate, common, property, localeUtils } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get("query") || "");
  const debounceTimer = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setSearchInput(searchParams.get("query") || "");
  }, [searchParams]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const current = searchParams.get("query") || "";
      const next = searchInput.trim();
      if (current === next) return;
      const usp = new URLSearchParams(searchParams.toString());
      if (next) usp.set("query", next);
      else usp.delete("query");
      router.replace(`${window.location.pathname}?${usp.toString()}`, {
        scroll: false,
      });
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput, router, searchParams]);

  useEffect(() => {
    observerRef.current?.disconnect();
    if (!sentinelRef.current || !hasNextPage) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "80px" }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, users.length]);

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

  return (
    <div className="flex flex-col min-h-0 h-full min-h-[320px] border-r border-gray-200 bg-white">
      <div className="p-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={translate('searchPlaceholder')}
            className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            autoComplete="off"
          />
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto"
        role="listbox"
        aria-label={common.leads}
      >
        {showInitialLoading ? (
          <ListSkeleton />
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
