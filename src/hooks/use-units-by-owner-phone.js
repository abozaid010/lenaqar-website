"use client";

import { useQuery } from "@tanstack/react-query";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { fetchUnitsByOwnerPhone } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";

/**
 * Loads all units for an owner phone via GET /units/by-owner-phone.
 * Disabled when phone is empty — caller should restore the default list.
 *
 * @param {string | null | undefined} phone
 */
export function useUnitsByOwnerPhone(phone) {
  const trimmed = typeof phone === "string" ? phone.trim() : "";
  const normalized = trimmed
    ? phoneToE164(trimmed, "EG") || trimmed
    : "";
  const enabled = Boolean(normalized);

  const query = useQuery({
    queryKey: unitKeys.byOwnerPhone(normalized),
    queryFn: () => fetchUnitsByOwnerPhone(normalized),
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  return {
    units: enabled ? (query.data?.data?.units ?? []) : [],
    count: enabled
      ? (query.data?.data?.count ?? query.data?.data?.units?.length ?? 0)
      : 0,
    isLoading: enabled && query.isLoading,
    isFetching: enabled && query.isFetching,
    isError: enabled && query.isError,
    error: enabled ? query.error : null,
    refetch: query.refetch,
    isPending: enabled && query.isPending,
  };
}
