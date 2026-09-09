import { cache } from "react";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import { getLenaqarTenantAccessToken } from "./tenant-auth.server";
import {
  comparePublicRequirements,
  toPublicRequirement,
} from "./to-public-requirement";

const PAGE_LIMIT = 50;
const MAX_PAGES = 6;
const DEFAULT_LIMIT = 48;

/**
 * @param {string} accessToken
 * @param {string} [cursor]
 */
async function fetchPendingPage(accessToken, cursor) {
  const qs = new URLSearchParams({ limit: String(PAGE_LIMIT) });
  if (cursor) qs.set("cursor", cursor);

  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

  const response = await bffFetch(
    `${API_BASE_URL}/requirements/pending?${qs}`,
    {
      headers,
      next: { revalidate: 300 },
    },
  );

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    const cf = isCloudflareChallenge(response, text);
    console.error(
      "[lenaqar] requirements pending failed",
      response.status,
      cf ? "(Cloudflare challenge)" : "",
    );
    return { items: [], nextCursor: null, hasMore: false };
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { items: [], nextCursor: null, hasMore: false };
  }

  const data = json?.data && typeof json.data === "object" ? json.data : {};
  const items = Array.isArray(data.requirements) ? data.requirements : [];
  const pagination =
    data.pagination && typeof data.pagination === "object"
      ? data.pagination
      : {};
  const nextCursor =
    typeof pagination.next_cursor === "string" && pagination.next_cursor
      ? pagination.next_cursor
      : null;
  const hasMore = Boolean(pagination.has_more_next);

  return { items, nextCursor, hasMore };
}

/**
 * Server-only: load pending CRM requirements, whitelist public fields, drop rent.
 * Never returns lead contact, assigned_to, user_id, or matching metadata.
 * Buyer-facing free text is exposed only as scrubbed `notes`.
 *
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ requirements: ReturnType<typeof toPublicRequirement>[], error: string | null }>}
 */
export const fetchPublicRequirements = cache(async function fetchPublicRequirements(
  options = {},
) {
  const limit = Math.min(
    Math.max(Number(options.limit) || DEFAULT_LIMIT, 1),
    100,
  );

  const accessToken = await getLenaqarTenantAccessToken();
  if (!accessToken) {
    return { requirements: [], error: "unavailable" };
  }

  /** @type {unknown[]} */
  const rawItems = [];
  let cursor;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const batch = await fetchPendingPage(accessToken, cursor);
    rawItems.push(...batch.items);
    if (!batch.hasMore || !batch.nextCursor) break;
    cursor = batch.nextCursor;
  }

  const seen = new Set();
  const publicRows = [];
  for (const raw of rawItems) {
    const row = toPublicRequirement(raw);
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    publicRows.push(row);
  }

  publicRows.sort(comparePublicRequirements);

  return {
    requirements: publicRows.slice(0, limit),
    error: null,
  };
});
