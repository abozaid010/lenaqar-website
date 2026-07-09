"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse, SocialMediaPostsParams, SocialPost } from "@/types/socialMedia";
import { getPosts } from "@/services/socialMedia";

export function useSocialMediaPosts(params: SocialMediaPostsParams) {
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 50;
  const status = params.status ?? "all";
  const accountId = params.account_id ?? "";
  const dateFrom = params.date_from ?? "";
  const dateTo = params.date_to ?? "";

  return useQuery<PaginatedResponse<SocialPost>, Error>({
    queryKey: [
      "social-media",
      "posts",
      { page, pageSize, status, accountId, dateFrom, dateTo },
    ],
    queryFn: () =>
      getPosts({
        page,
        page_size: pageSize,
        status,
        account_id: accountId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
