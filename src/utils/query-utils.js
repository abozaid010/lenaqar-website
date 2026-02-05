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
  details: (id, isPublic) => [...unitKeys.all, "detail", { id, isPublic }],
  detail: (id) => [...unitKeys.details(), id],
};

// Query key factory for campaigns
export const campaignKeys = {
  all: ["campaigns"],
  lists: () => [...campaignKeys.all, "list"],
  list: (params) => [...campaignKeys.lists(), params],
  details: () => [...campaignKeys.all, "detail"],
  detail: (id) => [...campaignKeys.details(), id],
};

// Query key factory for developers
export const developerKeys = {
  all: ["developers"],
  lists: (client_id, isPublic) => [
    ...developerKeys.all,
    "list",
    { client_id, isPublic },
  ],
};

// Query key factory for compounds
export const compoundKeys = {
  all: ["compounds"],
  lists: (client_id, isPublic) => [
    ...compoundKeys.all,
    "list",
    { client_id, isPublic },
  ],
};

// Query key factory for project names (lightweight)
export const projectNamesKeys = {
  all: ["projectNames"],
  lists: (isPublic) => [...projectNamesKeys.all, "list", { isPublic }],
};

// Query key factory for paginated projects (full data, cursor-based)
export const paginatedProjectKeys = {
  all: ["paginatedProjects"],
  list: (filters) => [...paginatedProjectKeys.all, "list", filters],
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

// Hook to provide query utilities for compounds
export function useCompoundQueries() {
  const queryClient = useQueryClient();

  const invalidateCompounds = () => {
    queryClient.invalidateQueries({ queryKey: compoundKeys.all });
  };

  const invalidateCompoundsList = (client_id, isPublic) => {
    if (client_id !== undefined && isPublic !== undefined) {
      queryClient.invalidateQueries({
        queryKey: compoundKeys.lists(client_id, isPublic),
      });
    } else {
      queryClient.invalidateQueries({ queryKey: compoundKeys.all });
    }
  };

  const refetchCompounds = (client_id, isPublic) => {
    if (client_id !== undefined && isPublic !== undefined) {
      queryClient.refetchQueries({
        queryKey: compoundKeys.lists(client_id, isPublic),
      });
    } else {
      queryClient.refetchQueries({ queryKey: compoundKeys.all });
    }
  };

  const prefetchCompounds = (client_id, isPublic) => {
    queryClient.prefetchQuery({
      queryKey: compoundKeys.lists(client_id, isPublic),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  return {
    invalidateCompounds,
    invalidateCompoundsList,
    refetchCompounds,
    prefetchCompounds,
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

// Helper function to update compounds in cache after mutations
export function updateCompoundsInCache(
  queryClient,
  compoundId,
  updateFn,
  client_id,
  isPublic
) {
  queryClient.setQueriesData(
    { queryKey: compoundKeys.lists(client_id, isPublic) },
    (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;

      return oldData.map((compound) =>
        compound.id === compoundId ? updateFn(compound) : compound
      );
    }
  );
}

// Helper function to add compound to cache
export function addCompoundToCache(
  queryClient,
  newCompound,
  client_id,
  isPublic
) {
  queryClient.setQueriesData(
    { queryKey: compoundKeys.lists(client_id, isPublic) },
    (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return [newCompound];

      return [newCompound, ...oldData];
    }
  );
}

// Helper function to remove compound from cache
export function removeCompoundFromCache(
  queryClient,
  compoundId,
  client_id,
  isPublic
) {
  queryClient.setQueriesData(
    { queryKey: compoundKeys.lists(client_id, isPublic) },
    (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;

      return oldData.filter((compound) => compound.id !== compoundId);
    }
  );
}
