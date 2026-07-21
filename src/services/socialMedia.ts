import type {
  ActivatePostsResponse,
  ActivationControlResponse,
  ActivationStatusResponse,
  DashboardSummary,
  PaginatedResponse,
  ReviewUpdateResponse,
  SocialComment,
  SocialMediaCommentsParams,
  SocialMediaPostsParams,
  SocialPost,
  SocialPostDetail,
} from "@/types/socialMedia";

/** Backend caps at 100; 20 keeps a batch under typical gateway timeouts. */
export const ACTIVATE_BATCH_LIMIT = 20;

/** Activate is blocking (2–6 min). Client may still abort first — batch keeps running. */
const ACTIVATE_CLIENT_TIMEOUT_MS = 5 * 60 * 1000;

export class RequestTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

function toQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === "all") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(
  path: string,
  init?: { method?: string; body?: unknown; timeoutMs?: number },
) {
  const method = (init?.method || "GET").toUpperCase();
  const headers: Record<string, string> = { accept: "application/json" };
  let body: string | undefined;
  if (init?.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }

  const signal =
    typeof init?.timeoutMs === "number" && init.timeoutMs > 0
      ? AbortSignal.timeout(init.timeoutMs)
      : undefined;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new RequestTimeoutError(error.message);
    }
    throw error;
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    // Upstream global error envelope uses `error_message` (no `detail`).
    const message =
      (json && (json.error_message || json.error || json.message)) ||
      `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return json as T;
}

export function getDashboardSummary() {
  return fetchJson<DashboardSummary>("/api/bff/social-media/dashboard/summary");
}

export function getPosts(params: SocialMediaPostsParams) {
  const qs = toQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
    status: params.status ?? "all",
    account_id: params.account_id,
    date_from: params.date_from,
    date_to: params.date_to,
  });
  return fetchJson<PaginatedResponse<SocialPost>>(`/api/bff/social-media/posts${qs}`);
}

export function getPost(postId: string) {
  return fetchJson<SocialPostDetail>(
    `/api/bff/social-media/posts/${encodeURIComponent(postId)}`
  );
}

export function getComments(params: SocialMediaCommentsParams) {
  const qs = toQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
    account_id: params.account_id,
    post_id: params.post_id,
    date_from: params.date_from,
    date_to: params.date_to,
  });
  return fetchJson<PaginatedResponse<SocialComment>>(`/api/bff/social-media/comments${qs}`);
}

export function getComment(commentId: string) {
  return fetchJson<SocialComment>(
    `/api/bff/social-media/comments/${encodeURIComponent(commentId)}`
  );
}

export function setDiscoveredPostReview(postId: string, isReviewed: boolean) {
  return fetchJson<ReviewUpdateResponse>(
    `/api/bff/social-media/discovered-posts/${encodeURIComponent(postId)}/review`,
    { method: "PATCH", body: { is_reviewed: isReviewed } },
  );
}

/** AI catch-up batch: activates up to `limit` unhandled discovered posts (live WhatsApp send). */
export function activateDiscoveredPosts(limit = ACTIVATE_BATCH_LIMIT) {
  return fetchJson<ActivatePostsResponse>(
    `/api/bff/social-media/api/discovered-posts/activate`,
    {
      method: "POST",
      body: { limit },
      timeoutMs: ACTIVATE_CLIENT_TIMEOUT_MS,
    },
  );
}

/** Poll AI activation state (running, pending backlog, pause / kill-switch). */
export function getActivationStatus() {
  return fetchJson<ActivationStatusResponse>(
    `/api/bff/social-media/api/activation/status`,
  );
}

/** Request pause after the in-flight post finishes. */
export function stopActivation() {
  return fetchJson<ActivationControlResponse>(
    `/api/bff/social-media/api/activation/stop`,
    { method: "POST" },
  );
}

/** Clear the pause latch so a new batch can be started. */
export function resumeActivation() {
  return fetchJson<ActivationControlResponse>(
    `/api/bff/social-media/api/activation/resume`,
    { method: "POST" },
  );
}
