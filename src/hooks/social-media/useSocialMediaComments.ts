"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  PaginatedResponse,
  SocialComment,
  SocialMediaCommentsParams,
} from "@/types/socialMedia";
import { getComments } from "@/services/socialMedia";

export function useSocialMediaComments(params: SocialMediaCommentsParams) {
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 50;
  const accountId = params.account_id ?? "";
  const postId = params.post_id ?? "";
  const dateFrom = params.date_from ?? "";
  const dateTo = params.date_to ?? "";

  return useQuery<PaginatedResponse<SocialComment>, Error>({
    queryKey: [
      "social-media",
      "comments",
      { page, pageSize, accountId, postId, dateFrom, dateTo },
    ],
    queryFn: () =>
      getComments({
        page,
        page_size: pageSize,
        account_id: accountId || undefined,
        post_id: postId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
