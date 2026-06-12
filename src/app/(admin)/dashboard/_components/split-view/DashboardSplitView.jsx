"use client";

import { useAverageScore } from "@/context/average-score";
import { useUsersInfiniteData } from "@/hooks/use-users-infinite-data";
import { removeUserFromInfiniteUsersCache, userKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useCallback } from "react";
import { useDashboardLeadsBulk } from "@/context/dashboard-leads-bulk-context";
import { useSearchParams } from "next/navigation";
import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";
import { buildDashboardFilterKey } from "@/utils/dashboard-filter-key";
import { sortDashboardLeadsByScore } from "@/utils/dashboard-lead-sort";
import { leadMatchesSearchQuery } from "@/utils/lead-list-search";
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

function DashboardSplitViewComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setAverageScore, setLoading } = useAverageScore();
  const {
    setVisibleLeadsFromList,
    toggleLeadSelection,
    toggleSelectAllVisible,
    isLeadSelected,
    hasSelection,
  } = useDashboardLeadsBulk();

  const filterKey = useMemo(
    () => buildDashboardFilterKey(searchParams),
    [searchParams],
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

  const allUsers = useMemo(() => flattenUsers(data), [data]);

  const searchQueryTrimmed = (searchParams.get("query") || "").trim();
  const sortScore = searchParams.get("sort_score");
  const filteredUsers = useMemo(() => {
    const searchFiltered = searchQueryTrimmed
      ? allUsers.filter((u) => leadMatchesSearchQuery(u, searchQueryTrimmed))
      : allUsers;
    return sortDashboardLeadsByScore(searchFiltered, sortScore);
  }, [allUsers, searchQueryTrimmed, sortScore]);

  useEffect(() => {
    setVisibleLeadsFromList(filteredUsers);
  }, [filteredUsers, setVisibleLeadsFromList]);

  useEffect(() => {
    setLoading(isLoading || isFetching);
    if (allUsers.length > 0) {
      const totalScore = allUsers.reduce((sum, user) => sum + (user.score || 0), 0);
      setAverageScore(totalScore / allUsers.length);
    } else {
      setAverageScore(null);
    }
  }, [allUsers, isLoading, isFetching, setAverageScore, setLoading]);

  const selectedLead = useMemo(() => {
    if (!selectedUserId) return null;
    return (
      filteredUsers.find((u) => u.user_id === selectedUserId) ||
      allUsers.find((u) => u.user_id === selectedUserId) ||
      null
    );
  }, [filteredUsers, allUsers, selectedUserId]);

  const onSelectLead = useCallback(
    (user) => {
      const usp = new URLSearchParams(searchParams.toString());
      usp.set("userId", user.user_id);
      router.replace(`${window.location.pathname}?${usp.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
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

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-1">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] min-h-0 flex-1 border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
        <LeadsListPane
          users={filteredUsers}
          totalLoadedLeads={allUsers.length}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          selectedUserId={selectedUserId}
          onSelectLead={onSelectLead}
          data={data}
          isLeadSelected={isLeadSelected}
          onToggleLeadSelection={toggleLeadSelection}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          hasBulkSelection={hasSelection}
        />
        <LeadDetailPane
          userId={selectedUserId}
          leadSummary={selectedLead}
          onInvalidateList={onInvalidateList}
          onLeadRemoved={onLeadRemoved}
        />
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
