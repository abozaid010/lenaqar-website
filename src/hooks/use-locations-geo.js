"use client";

import { useQuery } from "@tanstack/react-query";
import CityManager from "@/utils/city_manager";

async function loadLocationsGeo() {
  const cityManager = CityManager.getInstance();
  await cityManager.initializeData();
  const [cities, districts, subDistricts] = await Promise.all([
    cityManager.getCities(),
    cityManager.getDistricts(),
    cityManager.getSubDistricts(),
  ]);
  if (!cities.length) {
    throw new Error("Locations catalog is empty");
  }
  return { cities, districts, subDistricts };
}

/**
 * Shared geo index for location pickers — React Query cache + retries across dialogs.
 */
export function useLocationsGeo({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["locations", "geo"],
    queryFn: loadLocationsGeo,
    enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
