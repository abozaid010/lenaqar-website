"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchPendingApprovalUnits } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import {
  PENDING_APPROVAL_PROGRESSIVE_MAX_PAGES,
  mergePendingUnitPages,
  parsePendingProgressiveParams,
  readPendingPageMeta,
  shouldContinuePendingProgressiveFetch,
  shouldProgressivePendingUnitsFetch,
} from "@/lib/units/pending-approval-progressive-fetch";

/**
 * @param {string|object} searchParams - Serialized filter payload
 * @param {object|null} [initialData] - Server-prefetched first page (from RSC)
 */
export function usePendingApprovalUnitsPageData(searchParams, initialData = null) {
  const queryClient = useQueryClient();
  const safeSearchParams =
    typeof searchParams === "string" && searchParams ? searchParams : "{}";
  const queryKey = unitKeys.pendingApprovalList(safeSearchParams);
  /** @type {React.MutableRefObject<string>} */
  const progressiveRunRef = useRef("");

  const unitsQuery = useQuery({
    queryKey,
    queryFn: () => fetchPendingApprovalUnits(safeSearchParams),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    ...(initialData != null ? { initialData } : {}),
  });

  const page1Settled = !unitsQuery.isFetching && Boolean(unitsQuery.data?.data);

  // Restricted roles: return page 1 immediately; merge pages 2–3 in background.
  // Deps intentionally omit unitsQuery.data identity so setQueryData merges do not
  // re-enter and cancel the in-flight progressive loop.
  useEffect(() => {
    if (!shouldProgressivePendingUnitsFetch()) return;

    const { parsed, hasCursor, pageSize: paramPageSize } =
      parsePendingProgressiveParams(safeSearchParams);

    // Manual cursor pagination keeps single-page behavior (admin-like).
    if (hasCursor) {
      progressiveRunRef.current = "";
      return;
    }

    if (!page1Settled) return;
    if (progressiveRunRef.current === safeSearchParams) return;

    const seed = queryClient.getQueryData(queryKey);
    if (!seed?.data) return;

    const firstMeta = readPendingPageMeta(seed);
    const pageSize = firstMeta.pageSize || paramPageSize;

    if (
      !shouldContinuePendingProgressiveFetch({
        pagesFetched: 1,
        maxPages: PENDING_APPROVAL_PROGRESSIVE_MAX_PAGES,
        hasMore: firstMeta.hasMore,
        lastPageUnitCount: firstMeta.unitCount,
        mergedUnitCount: firstMeta.unitCount,
        pageSize,
      })
    ) {
      progressiveRunRef.current = safeSearchParams;
      return;
    }

    progressiveRunRef.current = safeSearchParams;
    let cancelled = false;

    (async () => {
      let mergedUnits = Array.isArray(seed?.data?.units)
        ? [...seed.data.units]
        : [];
      let cursor = firstMeta.cursor;
      let pagesFetched = 1;
      let lastPagination = seed?.data?.pagination ?? null;

      while (!cancelled && cursor) {
        if (
          !shouldContinuePendingProgressiveFetch({
            pagesFetched,
            maxPages: PENDING_APPROVAL_PROGRESSIVE_MAX_PAGES,
            hasMore: true,
            lastPageUnitCount: pageSize,
            mergedUnitCount: mergedUnits.length,
            pageSize,
          })
        ) {
          break;
        }

        let nextResponse;
        try {
          nextResponse = await fetchPendingApprovalUnits(
            JSON.stringify({
              ...parsed,
              cursor,
              direction: "forward",
            }),
          );
        } catch (err) {
          console.error(
            "[pending-approval] progressive page fetch failed",
            err?.message ?? err,
          );
          break;
        }
        if (cancelled) return;

        const nextUnits = Array.isArray(nextResponse?.data?.units)
          ? nextResponse.data.units
          : [];
        const nextMeta = readPendingPageMeta(nextResponse);
        mergedUnits = mergePendingUnitPages(mergedUnits, nextUnits);
        pagesFetched += 1;
        lastPagination = nextResponse?.data?.pagination ?? lastPagination;
        cursor = nextMeta.hasMore ? nextMeta.cursor : null;

        queryClient.setQueryData(queryKey, (old) => {
          const base = old && typeof old === "object" ? old : nextResponse;
          return {
            ...base,
            data: {
              ...(base?.data && typeof base.data === "object" ? base.data : {}),
              units: mergedUnits,
              pagination: lastPagination,
            },
          };
        });

        if (nextUnits.length === 0) break;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [safeSearchParams, queryKey, queryClient, page1Settled]);

  return {
    units: unitsQuery.data?.data?.units ?? [],
    pagination: unitsQuery.data?.data?.pagination ?? null,
    isLoading: unitsQuery.isLoading,
    error: unitsQuery.error,
    isError: unitsQuery.isError,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
    isPending: unitsQuery.isPending,
  };
}
