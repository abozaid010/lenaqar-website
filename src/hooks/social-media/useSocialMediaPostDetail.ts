"use client";

import { useQuery } from "@tanstack/react-query";
import type { SocialPostDetail } from "@/types/socialMedia";
import { getPost } from "@/services/socialMedia";

export function useSocialMediaPostDetail(postId: string | null) {
  return useQuery<SocialPostDetail, Error>({
    queryKey: ["social-media", "post", postId],
    queryFn: () => getPost(postId!),
    enabled: Boolean(postId),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: false,
  });
}
