"use client";

import { fetchUsersData } from "@/utils/api";
import { userKeys } from "@/utils/query-utils";
import { useInfiniteQuery } from "@tanstack/react-query";

/**
 * @param {string} searchParams - JSON.stringify of URL-derived filter object (action, dates, campaign_ids, query, etc.)
 */
export function useUsersInfiniteData(searchParams) {
  const safeSearchParams =
    typeof searchParams === "string" && searchParams
      ? searchParams
      : JSON.stringify(searchParams ?? {});

  return useInfiniteQuery({
    queryKey: userKeys.infiniteList(safeSearchParams),
    queryFn: ({ pageParam }) =>
      fetchUsersData(safeSearchParams, pageParam ? { cursor: pageParam } : {}),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination?.has_more_next || !pagination?.next_cursor) {
        return undefined;
      }
      return pagination.next_cursor;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: undefined,
  });
}
