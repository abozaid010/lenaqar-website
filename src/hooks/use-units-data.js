"use client";

import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
  fetchUnitsFilter,
} from "@/utils/api";
import {
  cityKeys,
  compoundKeys,
  developerKeys,
  unitKeys,
} from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

export function useUnitsData(searchParams, enabled = true) {
  return useQuery({
    queryKey: unitKeys.list(searchParams),
    queryFn: () => fetchUnitsFilter(searchParams),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDevelopersData(enabled = true) {
  return useQuery({
    queryKey: developerKeys.lists(),
    queryFn: fetchDevelopers,
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes (developers don't change often)
    refetchOnWindowFocus: false,
  });
}

export function useCompoundsData(enabled = true) {
  return useQuery({
    queryKey: compoundKeys.lists(),
    queryFn: fetchcombounds,
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCitiesAndProjectsData(enabled = true) {
  return useQuery({
    queryKey: cityKeys.lists(),
    queryFn: fetchCitisAndProjects,
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutes (cities rarely change)
    refetchOnWindowFocus: false,
  });
}
