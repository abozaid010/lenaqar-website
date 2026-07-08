"use client";

import { useQuery } from "@tanstack/react-query";
import type { SocialComment } from "@/types/socialMedia";
import { getComment } from "@/services/socialMedia";

export function useSocialMediaCommentDetail(commentId: string | null) {
  return useQuery<SocialComment, Error>({
    queryKey: ["social-media", "comment", commentId],
    queryFn: () => getComment(commentId!),
    enabled: Boolean(commentId),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}
