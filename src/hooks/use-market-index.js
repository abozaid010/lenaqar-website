"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCards,
  fetchCard,
  fetchLocationChildren,
  saveCard,
  saveUnit,
  deleteUnit,
  publishCard,
  fetchHistory,
  fetchVersion,
} from "@/utils/market-index-api";

export const marketIndexKeys = {
  cards: (status) => ["market-index", "cards", status ?? "all"],
  card: (id) => ["market-index", "card", id],
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

export function useLocationChildren(locationId) {
  return useQuery({
    queryKey: marketIndexKeys.children(locationId),
    queryFn: () => fetchLocationChildren(locationId),
    enabled: !!locationId,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
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
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

function invalidateCardQueries(queryClient, locationId) {
  queryClient.invalidateQueries({ queryKey: marketIndexKeys.card(locationId) });
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
