"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminClients, updateAdminClient } from "@/utils/api";
import { clientKeys } from "@/utils/query-utils";

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

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, payload }) => updateAdminClient(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
