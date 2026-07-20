"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCards,
  fetchCard,
  fetchLocationChildren,
  fetchLocationLeaves,
  fetchLocationRoots,
  fetchLocationNode,
  fetchActiveCard,
  postEstimate,
  saveCard,
  saveUnit,
  deleteUnit,
  publishCard,
  fetchHistory,
  fetchVersion,
} from "@/utils/market-index-api";

const LOCATION_STALE_MS = 1000 * 60 * 60;

export const marketIndexKeys = {
  cards: (status) => ["market-index", "cards", status ?? "all"],
  card: (id) => ["market-index", "card", id],
  activeCard: (id) => ["market-index", "active-card", id],
  locationRoots: () => ["market-index", "locations", "roots"],
  locationLeaves: () => ["market-index", "locations", "leaves"],
  location: (id) => ["market-index", "location", id],
  children: (id) => ["market-index", "locations", id],
  history: (id) => ["market-index", "history", id],
  version: (id, v) => ["market-index", "version", id, v],
};

export function useMarketCards(status, initialData, enabled = true) {
  return useQuery({
    queryKey: marketIndexKeys.cards(status),
    queryFn: () => fetchCards({ status: status || undefined }),
    enabled,
    initialData:
      status == null || status === "" || status === "all"
        ? initialData
        : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMarketCard(locationId, initialData) {
  return useQuery({
    queryKey: marketIndexKeys.card(locationId),
    queryFn: () => fetchCard(locationId),
    enabled: !!locationId,
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useLocationRoots(enabled = true) {
  return useQuery({
    queryKey: marketIndexKeys.locationRoots(),
    queryFn: fetchLocationRoots,
    enabled,
    staleTime: LOCATION_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useLocationLeaves(enabled = true) {
  return useQuery({
    queryKey: marketIndexKeys.locationLeaves(),
    queryFn: () => fetchLocationLeaves({ limit: 2000 }),
    enabled,
    staleTime: LOCATION_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useLocationNode(locationId, enabled = true) {
  return useQuery({
    queryKey: marketIndexKeys.location(locationId),
    queryFn: () => fetchLocationNode(locationId),
    enabled: !!locationId && enabled,
    staleTime: LOCATION_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

export function useLocationChildren(locationId) {
  return useQuery({
    queryKey: marketIndexKeys.children(locationId),
    queryFn: () => fetchLocationChildren(locationId),
    enabled: !!locationId,
    staleTime: LOCATION_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

/** `data === null` means no published card (404). */
export function useActiveCard(locationId) {
  return useQuery({
    queryKey: marketIndexKeys.activeCard(locationId),
    queryFn: () => fetchActiveCard(locationId),
    enabled: !!locationId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.status === 404) return false;
      if (error?.status === 429 && failureCount < 1) return true;
      return failureCount < 1;
    },
  });
}

export function useEstimate() {
  return useMutation({
    mutationFn: (body) => postEstimate(body),
  });
}

export function useMarketHistory(locationId, enabled = false) {
  return useQuery({
    queryKey: marketIndexKeys.history(locationId),
    queryFn: () => fetchHistory(locationId),
    enabled: !!locationId && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMarketVersion(locationId, version, enabled = false) {
  return useQuery({
    queryKey: marketIndexKeys.version(locationId, version),
    queryFn: () => fetchVersion(locationId, version),
    enabled: !!locationId && version != null && enabled,
    staleTime: LOCATION_STALE_MS,
    refetchOnWindowFocus: false,
  });
}

function invalidateCardQueries(queryClient, locationId) {
  queryClient.invalidateQueries({ queryKey: marketIndexKeys.card(locationId) });
  queryClient.invalidateQueries({
    queryKey: marketIndexKeys.activeCard(locationId),
  });
  queryClient.invalidateQueries({ queryKey: ["market-index", "cards"] });
}

export function useSaveCard(locationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => saveCard(locationId, body),
    onSuccess: () => invalidateCardQueries(queryClient, locationId),
  });
}

export function useSaveUnit(locationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unitBody) => saveUnit(locationId, unitBody),
    onSuccess: () => invalidateCardQueries(queryClient, locationId),
  });
}

export function useDeleteUnit(locationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unitId) => deleteUnit(locationId, unitId),
    onSuccess: () => invalidateCardQueries(queryClient, locationId),
  });
}

export function usePublishCard(locationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishCard(locationId),
    onSuccess: () => {
      invalidateCardQueries(queryClient, locationId);
      queryClient.invalidateQueries({
        queryKey: marketIndexKeys.history(locationId),
      });
    },
  });
}
