/**
 * Social monitoring API types.
 *
 * Upstream (LENAAI-Agent `social_monitoring_router`, Bearer access token):
 * - GET /posts
 * - GET /posts/{post_id}
 * - GET /comments
 * - GET /comments/{comment_id}
 * - GET /discovered-posts
 * - GET /discovered-posts/{post_id}
 * - PATCH /discovered-posts/{post_id}/review
 * - GET /dashboard/summary
 * - POST /api/discovered-posts/activate (AI catch-up batch; live WhatsApp send)
 * - POST /api/activation/stop
 * - POST /api/activation/resume
 * - GET  /api/activation/status
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
  /** Full text of the original FB post that was commented on. Empty for legacy records. */
  post_content: string;
  comment_text: string;
  status: SocialMediaStatus;
  created_at: string | null;
  published_at: string | null;
  /** Linked Firestore `posts` document id (discovered post). */
  post_id?: string | null;
  /** Human handled the lead (joined from discovered post). */
  is_reviewed?: boolean;
  /** First E.164 contact from discovered post; may be null. */
  phone_number?: string | null;
}

export interface ReviewUpdateResponse {
  id: string;
  is_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

/** Why a batch ended early via the operator brake. */
export type ActivationStopReason =
  | "stop_requested"
  | "disabled_by_operator"
  | "control_unavailable";

/** Response from the AI catch-up batch activation endpoint. */
export interface ActivatePostsResponse {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  disabled: boolean;
  client_id: string;
  /** True when the operator brake ended the run early. */
  stopped?: boolean;
  stop_reason?: ActivationStopReason | string;
}

/** Polling snapshot for AI activation progress / control state. */
export interface ActivationStatusResponse {
  enabled: boolean;
  stop_requested: boolean;
  pending_posts: number;
  running: boolean;
}

/** Response from POST /api/activation/stop or /resume. */
export interface ActivationControlResponse {
  success: boolean;
  message: string;
  stop_requested?: boolean;
}

/** UI phase derived from activation status (+ local start-in-flight). */
export type ActivationPhase =
  | "idle"
  | "running"
  | "pausing"
  | "paused"
  | "disabled";

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
