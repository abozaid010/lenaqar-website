"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/services/socialMedia";

export function useSocialMediaDashboardSummary() {
  return useQuery({
    queryKey: ["social-media", "dashboard-summary"],
    queryFn: getDashboardSummary,
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}

