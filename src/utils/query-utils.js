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

// Query key factory for units
export const unitKeys = {
  all: ["units"],
  lists: () => [...unitKeys.all, "list"],
  list: (filters) => [...unitKeys.lists(), filters],
  details: () => [...unitKeys.all, "detail"],
  detail: (id) => [...unitKeys.details(), id],
};

// Query key factory for developers
export const developerKeys = {
  all: ["developers"],
  lists: () => [...developerKeys.all, "list"],
};

// Query key factory for compounds
export const compoundKeys = {
  all: ["compounds"],
  lists: () => [...compoundKeys.all, "list"],
};

// Query key factory for cities and projects
export const cityKeys = {
  all: ["cities"],
  lists: () => [...cityKeys.all, "list"],
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

// Hook to provide query utilities for units
export function useUnitQueries() {
  const queryClient = useQueryClient();

  const invalidateUnits = () => {
    queryClient.invalidateQueries({ queryKey: unitKeys.all });
  };

  const invalidateUnitsList = () => {
    queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
  };

  const refetchUnits = (searchParams) => {
    if (searchParams) {
      queryClient.refetchQueries({ queryKey: unitKeys.list(searchParams) });
    } else {
      queryClient.refetchQueries({ queryKey: unitKeys.lists() });
    }
  };

  const prefetchUnits = (searchParams) => {
    queryClient.prefetchQuery({
      queryKey: unitKeys.list(searchParams),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  return {
    invalidateUnits,
    invalidateUnitsList,
    refetchUnits,
    prefetchUnits,
  };
}

// Helper function to update units in cache after mutations
export function updateUnitsInCache(queryClient, unitId, updateFn) {
  queryClient.setQueriesData({ queryKey: unitKeys.lists() }, (oldData) => {
    if (!oldData?.data?.units) return oldData;

    return {
      ...oldData,
      data: {
        ...oldData.data,
        units: oldData.data.units.map((unit) =>
          unit.unitId === unitId ? updateFn(unit) : unit
        ),
      },
    };
  });
}

// Helper function to add unit to cache
export function addUnitToCache(queryClient, newUnit) {
  queryClient.setQueriesData({ queryKey: unitKeys.lists() }, (oldData) => {
    if (!oldData?.data?.units) return oldData;

    return {
      ...oldData,
      data: {
        ...oldData.data,
        units: [newUnit, ...oldData.data.units],
      },
    };
  });
}

// Helper function to remove unit from cache
export function removeUnitFromCache(queryClient, unitId) {
  queryClient.setQueriesData({ queryKey: unitKeys.lists() }, (oldData) => {
    if (!oldData?.data?.units) return oldData;

    return {
      data: {
        ...oldData.data,
        units: oldData.data.units.filter((unit) => unit.unitId !== unitId),
      },
    };
  });
}
