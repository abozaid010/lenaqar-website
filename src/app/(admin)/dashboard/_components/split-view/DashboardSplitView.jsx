"use client";

import { useAverageScore } from "@/context/average-score";
import { useUsersInfiniteData } from "@/hooks/use-users-infinite-data";
import { removeUserFromInfiniteUsersCache, userKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";
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

  const filterKey = useMemo(() => {
    const o = Object.fromEntries(searchParams.entries());
    delete o.userId;
    delete o.cursor;
    delete o.direction;
    return JSON.stringify(o);
  }, [searchParams]);

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

  const users = useMemo(() => flattenUsers(data), [data]);

  useEffect(() => {
    setLoading(isLoading || isFetching);
    if (users.length > 0) {
      const totalScore = users.reduce((sum, user) => sum + (user.score || 0), 0);
      setAverageScore(totalScore / users.length);
    } else {
      setAverageScore(null);
    }
  }, [users, isLoading, isFetching, setAverageScore, setLoading]);

  const selectedLead = useMemo(
    () => users.find((u) => u.user_id === selectedUserId) || null,
    [users, selectedUserId]
  );

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
          users={users}
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
