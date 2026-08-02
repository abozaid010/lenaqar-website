"use client";

import { useAverageScore } from "@/context/average-score";
import { useUsersInfiniteData } from "@/hooks/use-users-infinite-data";
import {
  patchUserInInfiniteUsersCaches,
  removeUserFromInfiniteUsersCache,
  userKeys,
} from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useDashboardLeadsBulk } from "@/context/dashboard-leads-bulk-context";
import { useSearchParams } from "next/navigation";
import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";
import { buildDashboardFilterKey } from "@/utils/dashboard-filter-key";
import {
  buildDashboardLeadHref,
  buildDashboardListHref,
} from "@/utils/dashboard-navigation";
import { sortDashboardLeads, DASHBOARD_SORT } from "@/utils/dashboard-lead-sort";
import { leadMatchesSearchQuery } from "@/utils/lead-list-search";
import { useLgViewport } from "@/hooks/use-lg-viewport";
import { useDashboardFilterPersistence } from "@/hooks/useDashboardFilterPersistence";
import { ThreeDotsLoader } from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  clearSessionHandledLeads,
  getSessionHandledLeadsKey,
  readSessionHandledLeads,
  writeSessionHandledLeads,
} from "@/lib/dashboard-session-handled-leads";
import LeadDetailPane from "./LeadDetailPane";
import LeadsListPane from "./LeadsListPane";

function flattenUsers(data) {
  if (!data?.pages?.length) return [];
  const map = new Map();
  for (const page of data.pages) {
    for (const u of page.users || []) {
      if (u?.user_id && !map.has(u.user_id)) map.set(u.user_id, u);
    }
  }
  return Array.from(map.values());
}

function readParam(params, key) {
  if (!params) return null;
  if (typeof params.get === "function") return params.get(key);
  const value = params[key];
  return value == null || value === "" ? null : String(value);
}

function DashboardSplitViewComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isLg = useLgViewport();
  const { common } = useI18n();
  const { setAverageScore, setLoading } = useAverageScore();
  const { effectiveFilterParams, leadSort } = useDashboardFilterPersistence();
  const {
    setVisibleLeadsFromList,
    toggleLeadSelection,
    toggleSelectAllVisible,
    isLeadSelected,
    hasSelection,
  } = useDashboardLeadsBulk();

  const filterKey = useMemo(
    () => buildDashboardFilterKey(effectiveFilterParams),
    [effectiveFilterParams],
  );

  const selectedUserId = searchParams.get("userId") || undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useUsersInfiniteData(filterKey);

  /** Initial load or filter change — not infinite scroll page fetches. */
  const isLeadsLoading =
    isLoading || (isFetching && !isFetchingNextPage && !data);

  const allUsers = useMemo(() => flattenUsers(data), [data]);

  /** Unique leads fetched client-side for the current filter key (deduped). */
  const loadedCount = allUsers.length;
  const pageCount = data?.pages?.length ?? 0;
  /**
   * messages/v2/all returns `count` = page size only, not total matching.
   * When every page is loaded (!hasNextPage), loadedCount is the true total.
   * null while loading or while more pages remain — never invent a total.
   */
  const totalMatchingLeads =
    !pageCount || hasNextPage ? null : loadedCount;

  const searchQueryTrimmed = (readParam(effectiveFilterParams, "query") || "").trim();
  /** Local sort of already-loaded leads — `sort` is excluded from the API filter key. */
  const filteredUsers = useMemo(() => {
    const searchFiltered = searchQueryTrimmed
      ? allUsers.filter((u) => leadMatchesSearchQuery(u, searchQueryTrimmed))
      : allUsers;
    return sortDashboardLeads(searchFiltered, leadSort);
  }, [allUsers, searchQueryTrimmed, leadSort]);

  useEffect(() => {
    setLoading(isLoading || isFetching);
    if (allUsers.length > 0) {
      const totalScore = allUsers.reduce((sum, user) => sum + (user.score || 0), 0);
      setAverageScore(totalScore / allUsers.length);
    } else {
      setAverageScore(null);
    }
  }, [allUsers, isLoading, isFetching, setAverageScore, setLoading]);

  const selectedLeadFromList = useMemo(() => {
    if (!selectedUserId) return null;
    return (
      filteredUsers.find((u) => u.user_id === selectedUserId) ||
      allUsers.find((u) => u.user_id === selectedUserId) ||
      null
    );
  }, [filteredUsers, allUsers, selectedUserId]);

  // Keep the clicked lead's dashboard fields (incl. ai_reply_enabled) even if the
  // row is temporarily missing from loaded/filtered pages.
  const [selectedLeadSnapshot, setSelectedLeadSnapshot] = useState(null);
  /** Brief green cue on the lead that just got an action (slides away). */
  const [handledFlashId, setHandledFlashId] = useState(null);
  /** Brief cue on the lead that becomes selected after an action. */
  const [advanceFlashId, setAdvanceFlashId] = useState(null);
  /** Durable tint for leads moved to bottom this tab session. */
  const [sessionHandledIds, setSessionHandledIds] = useState(() => new Set());
  const skipListScrollRef = useRef(false);
  const flashTimersRef = useRef({ handled: null, advance: null });
  const prevFilterKeyRef = useRef(null);
  const sessionHandledKey = useMemo(
    () => getSessionHandledLeadsKey(LenaCookiesManager.getClientId()),
    [],
  );

  useEffect(() => {
    setSessionHandledIds(readSessionHandledLeads(sessionHandledKey));
  }, [sessionHandledKey]);

  // Clear session marks when applied dashboard filters change (not on first mount).
  useEffect(() => {
    if (prevFilterKeyRef.current === null) {
      prevFilterKeyRef.current = filterKey;
      return;
    }
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    clearSessionHandledLeads(sessionHandledKey);
    setSessionHandledIds(new Set());
  }, [filterKey, sessionHandledKey]);

  const selectedLead = useMemo(() => {
    if (!selectedUserId) return null;
    if (selectedLeadFromList) return selectedLeadFromList;
    if (selectedLeadSnapshot?.user_id === selectedUserId) {
      return selectedLeadSnapshot;
    }
    return null;
  }, [selectedUserId, selectedLeadFromList, selectedLeadSnapshot]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedLeadSnapshot(null);
      return;
    }
    if (
      selectedLeadFromList &&
      selectedLeadFromList.user_id === selectedUserId
    ) {
      setSelectedLeadSnapshot(selectedLeadFromList);
    }
  }, [selectedUserId, selectedLeadFromList]);

  const onSelectLead = useCallback(
    (user) => {
      if (user?.user_id) {
        setSelectedLeadSnapshot(user);
        // Seed detail cache so mobile `/dashboard/[userId]` (no leadSummary prop)
        // can hydrate owner_type / name / notes without waiting on conversation API.
        queryClient.setQueryData(userKeys.detail(user.user_id), user);
      }
      if (!isLg) {
        router.push(buildDashboardLeadHref(user.user_id, searchParams));
        return;
      }

      const usp = new URLSearchParams(searchParams.toString());
      usp.set("userId", user.user_id);
      router.replace(`${window.location.pathname}?${usp.toString()}`, {
        scroll: false,
      });
    },
    [isLg, queryClient, router, searchParams]
  );

  /**
   * Move to bottom button only: flash, select next, reorder, session green tint.
   * Saving an action does none of this.
   */
  const onMoveLeadToBottom = useCallback(
    (user) => {
      const handledUserId = user?.user_id;
      if (!handledUserId) return;

      const idx = filteredUsers.findIndex((u) => u.user_id === handledUserId);
      const nextLead = idx >= 0 ? filteredUsers[idx + 1] ?? null : null;

      if (flashTimersRef.current.handled) {
        clearTimeout(flashTimersRef.current.handled);
      }
      if (flashTimersRef.current.advance) {
        clearTimeout(flashTimersRef.current.advance);
      }

      setHandledFlashId(handledUserId);
      flashTimersRef.current.handled = setTimeout(() => {
        setHandledFlashId(null);
        flashTimersRef.current.handled = null;
      }, 700);

      if (nextLead && nextLead.user_id !== selectedUserId) {
        setAdvanceFlashId(nextLead.user_id);
        flashTimersRef.current.advance = setTimeout(() => {
          setAdvanceFlashId(null);
          flashTimersRef.current.advance = null;
        }, 650);

        skipListScrollRef.current = true;
        onSelectLead(nextLead);
      }

      const updated_at =
        leadSort === DASHBOARD_SORT.OLDEST
          ? new Date().toISOString()
          : new Date(0).toISOString();

      patchUserInInfiniteUsersCaches(queryClient, handledUserId, {
        updated_at,
      });

      setSessionHandledIds((prev) => {
        if (prev.has(handledUserId)) return prev;
        const next = new Set(prev);
        next.add(handledUserId);
        writeSessionHandledLeads(sessionHandledKey, next);
        return next;
      });
    },
    [
      filteredUsers,
      leadSort,
      onSelectLead,
      queryClient,
      selectedUserId,
      sessionHandledKey,
    ],
  );

  useEffect(() => {
    return () => {
      if (flashTimersRef.current.handled) {
        clearTimeout(flashTimersRef.current.handled);
      }
      if (flashTimersRef.current.advance) {
        clearTimeout(flashTimersRef.current.advance);
      }
    };
  }, []);

  // Tapping Call initiates the phone call (the tel: link on the button) and also
  // opens the lead's detail view, so the user lands on the right customer after
  // the call instead of hunting for the row again.
  const onCallLead = useCallback(
    (user) => {
      if (user?.user_id) onSelectLead(user);
    },
    [onSelectLead],
  );

  const onInvalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  }, [queryClient]);

  const onLeadRemoved = useCallback(
    (deletedUserId) => {
      removeUserFromInfiniteUsersCache(queryClient, filterKey, deletedUserId);
    },
    [queryClient, filterKey]
  );

  useEffect(() => {
    if (isLg || !selectedUserId) return;
    router.replace(buildDashboardLeadHref(selectedUserId, searchParams));
  }, [isLg, router, searchParams, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || selectedLead) return;
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [
    selectedUserId,
    selectedLead,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Only scroll on selection identity change — never when the same lead's
  // fields update (e.g. last_action / updated_at) and the row re-sorts away.
  useEffect(() => {
    if (!selectedUserId) return;
    if (skipListScrollRef.current) {
      skipListScrollRef.current = false;
      return;
    }
    const el = document.querySelector(
      `[data-user-id="${CSS.escape(selectedUserId)}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedUserId]);

  const showMobileDetail = !isLg && Boolean(selectedUserId);

  const onMobileBack = useCallback(() => {
    router.push(buildDashboardListHref(searchParams));
  }, [router, searchParams]);

  return (
    <div className="flex flex-col min-h-0 min-w-0 flex-1 gap-1">
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(196px,252px)_minmax(0,1fr)] min-h-0 min-w-0 w-full flex-1 border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
        {showMobileDetail ? null : (
          <LeadsListPane
            users={filteredUsers}
            sortKey={leadSort}
            totalLoadedLeads={loadedCount}
            totalMatchingLeads={totalMatchingLeads}
            pageCount={pageCount}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            isError={isError}
            error={error}
            refetch={refetch}
            selectedUserId={isLg ? selectedUserId : undefined}
            onSelectLead={onSelectLead}
            onCallLead={onCallLead}
            onMoveLeadToBottom={onMoveLeadToBottom}
            handledFlashId={handledFlashId}
            advanceFlashId={advanceFlashId}
            sessionHandledIds={sessionHandledIds}
            data={data}
            isLeadSelected={isLeadSelected}
            onToggleLeadSelection={toggleLeadSelection}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            hasBulkSelection={hasSelection}
            onVisibleLeadsChange={setVisibleLeadsFromList}
          />
        )}
        <div
          className={
            showMobileDetail
              ? "flex flex-col min-h-0 flex-1"
              : "hidden lg:flex flex-col min-h-0 lg:min-h-[320px] flex-1"
          }
        >
          <LeadDetailPane
            userId={selectedUserId}
            leadSummary={selectedLead}
            onInvalidateList={onInvalidateList}
            onLeadRemoved={onLeadRemoved}
            showBackButton={showMobileDetail}
            onBack={showMobileDetail ? onMobileBack : undefined}
            isListLoading={isLeadsLoading}
          />
        </div>
        {isLeadsLoading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/85 backdrop-blur-[1px]">
            <ThreeDotsLoader
              label={common.loadingData || common.loading}
              containerClassName="flex flex-col items-center justify-center gap-3"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardSplitView() {
  return (
    <SearchParamsWrapper>
      <DashboardSplitViewComponent />
    </SearchParamsWrapper>
  );
}
