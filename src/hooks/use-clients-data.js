"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchAdminClients, fetchClientPermissionSchema, updateAdminClient } from "@/utils/api";
import { filterBySearchQuery } from "@/utils/search-utils";
import { clientKeys } from "@/utils/query-utils";
import {
  parsePermissionSchemaResponse,
  sanitizeModuleActions,
  getResolvedPermissionSchema,
} from "@/lib/permission-schema";

const CLIENTS_PAGE_SIZE = 20;

export function useClientsInfinite(search = "") {
  const trimmedSearch = typeof search === "string" ? search.trim() : "";

  const query = useInfiniteQuery({
    queryKey: clientKeys.infiniteList(trimmedSearch),
    queryFn: ({ pageParam }) =>
      fetchAdminClients(pageParam ?? 1, CLIENTS_PAGE_SIZE, trimmedSearch),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pageData = lastPage?.data;
      if (!pageData?.has_next) return undefined;
      return (pageData.page || 1) + 1;
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const allItems =
    query.data?.pages.flatMap((page) => page?.data?.items || []) || [];

  const displayItems = trimmedSearch
    ? filterBySearchQuery(allItems, trimmedSearch, [
        "client_id",
        "client_name",
        "email",
      ])
    : allItems;

  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const hasNextPage = Boolean(lastPage?.data?.has_next);

  return {
    items: displayItems,
    allLoadedItems: allItems,
    hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    data: query.data,
  };
}

export function useClients(page = 1, pageSize = 10) {
  const query = useQuery({
    queryKey: clientKeys.list(page),
    queryFn: () => fetchAdminClients(page, pageSize),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    items: query.data?.data?.items || [],
    pagination: {
      page: query.data?.data?.page || page,
      total: query.data?.data?.total || 0,
      hasNext: query.data?.data?.has_next || false,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function useClientPermissionSchema(enabled = true) {
  const query = useQuery({
    queryKey: clientKeys.permissionSchema(),
    queryFn: fetchClientPermissionSchema,
    enabled,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const rawSchema = useMemo(
    () => parsePermissionSchemaResponse(query.data),
    [query.data]
  );
  const schema = useMemo(
    () => getResolvedPermissionSchema(rawSchema),
    [rawSchema]
  );

  return {
    schema,
    rawSchema,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateClient() {
  return useMutation({
    mutationFn: ({ clientId, payload }) => updateAdminClient(clientId, payload),
  });
}
