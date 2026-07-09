/**
 * Social monitoring API types.
 *
 * Upstream (LENAAI-Agent `social_monitoring_router`, Bearer access token):
 * - GET /posts
 * - GET /posts/{post_id}
 * - GET /comments
 * - GET /comments/{comment_id}
 * - GET /dashboard/summary
 *
 * Browser calls same-origin BFF: `/api/bff/social-media/*`
 */

export const SOCIAL_MEDIA_STATUSES = [
  "pending",
  "publishing",
  "published",
  "failed",
  "deleted",
] as const;

export type SocialMediaStatus = (typeof SOCIAL_MEDIA_STATUSES)[number];

export function normalizeSocialMediaStatus(value: unknown): SocialMediaStatus {
  if (
    typeof value === "string" &&
    (SOCIAL_MEDIA_STATUSES as readonly string[]).includes(value)
  ) {
    return value as SocialMediaStatus;
  }
  return "pending";
}

export interface DashboardSummary {
  total_posts: number;
  published_posts: number;
  failed_posts: number;
  total_comments: number;
  published_comments: number;
  failed_comments: number;
  accounts: number;
  groups: number;
  today_posts: number;
  today_comments: number;
}

export interface SocialPost {
  id: string;
  account_name: string;
  group_name: string;
  group_url: string;
  post_content: string;
  post_url: string | null;
  status: SocialMediaStatus;
  created_at: string | null;
  published_at: string | null;
}

export interface SocialPostDetail extends SocialPost {
  comments_count: number;
}

export interface SocialComment {
  id: string;
  account_name: string;
  group_name: string;
  group_url: string;
  post_url: string | null;
  comment_text: string;
  status: SocialMediaStatus;
  created_at: string | null;
  published_at: string | null;
}

export interface PaginatedResponse<TItem> {
  total: number;
  page: number;
  page_size: number;
  items: TItem[];
}

export interface SocialMediaPostsParams {
  page?: number;
  page_size?: number;
  status?: SocialMediaStatus | "all";
  account_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface SocialMediaCommentsParams {
  page?: number;
  page_size?: number;
  account_id?: string;
  post_id?: string;
  date_from?: string;
  date_to?: string;
}
