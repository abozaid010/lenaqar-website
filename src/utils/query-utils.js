"use client";

import { useQueryClient } from "@tanstack/react-query";

// Query key factory for users
export const userKeys = {
  all: ["users"],
  lists: () => [...userKeys.all, "list"],
  list: (filters) => [...userKeys.lists(), filters],
  details: () => [...userKeys.all, "detail"],
  detail: (id) => [...userKeys.details(), id],
};

// Hook to provide query utilities for users
export function useUserQueries() {
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  const invalidateUsersList = () => {
    queryClient.invalidateQueries({ queryKey: userKeys.lists() });
  };

  const refetchUsers = (searchParams) => {
    if (searchParams) {
      queryClient.refetchQueries({ queryKey: userKeys.list(searchParams) });
    } else {
      queryClient.refetchQueries({ queryKey: userKeys.lists() });
    }
  };

  const prefetchUsers = (searchParams) => {
    queryClient.prefetchQuery({
      queryKey: userKeys.list(searchParams),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  return {
    invalidateUsers,
    invalidateUsersList,
    refetchUsers,
    prefetchUsers,
  };
}
