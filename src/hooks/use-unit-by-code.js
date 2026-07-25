"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUnitByCode } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";

/**
 * On-demand lookup of a single unit by its reference code.
 * Search-on-submit: pass the submitted code (not the raw input value) so the
 * request only fires once the user commits, and call `refetch()` to re-run
 * the same code (e.g. the user searches the same code again after editing it).
 */
export function useUnitByCode(code) {
  const trimmedCode = typeof code === "string" ? code.trim() : "";

  const query = useQuery({
    queryKey: unitKeys.byCode(trimmedCode),
    queryFn: () => fetchUnitByCode(trimmedCode, false),
    enabled: Boolean(trimmedCode),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const rawUnit =
    trimmedCode && query.data?.status === true ? (query.data?.data ?? null) : null;
  const notFound =
    Boolean(trimmedCode) && query.isFetched && !query.isFetching && !rawUnit;

  return {
    rawUnit,
    isSearching: query.isFetching,
    notFound,
    refetch: query.refetch,
  };
}
