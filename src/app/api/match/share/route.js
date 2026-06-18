import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { signMatchSharePayload } from "@/lib/match/share-token-server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rateLimit";
import { bffFetch } from "@/lib/bffFetch";

const SHARE_RATE_LIMIT = 20;    // token creations
const SHARE_WINDOW_MS = 60_000; // per 60 seconds

/**
 * POST /api/match/share
 * Creates a share token for a lead/unit-filter set.
 * Requires an active session — only authenticated agents should create share links.
 */
export async function POST(request) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const { allowed, retryAfter } = rateLimit(`share:${ip}`, SHARE_RATE_LIMIT, SHARE_WINDOW_MS);
  if (!allowed) return rateLimitExceededResponse(retryAfter);

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    // ── Mandatory auth ─────────────────────────────────────────────────────
    if (!accessToken) {
      return NextResponse.json(
        { status: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { client_id, user_id, lead, requirements } = body || {};

    if (!user_id) {
      return NextResponse.json(
        { status: false, message: "user_id is required" },
        { status: 400 }
      );
    }

    const resolvedClientId =
      client_id || cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || "";

    // Try backend share API first
    try {
      const backendRes = await bffFetch(`${API_BASE_URL}/match/share/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(resolvedClientId ? { "x-client-id": resolvedClientId } : {}),
        },
        body: JSON.stringify({ client_id: resolvedClientId, user_id, lead, requirements }),
        cache: "no-store",
      });

      if (backendRes.ok) {
        const json = await backendRes.json();
        const token = json?.data?.token || json?.data?.share_token || json?.token;
        if (token) {
          return NextResponse.json({ status: true, data: { token, source: "backend" } });
        }
      }
    } catch {
      // fall through to BFF-signed token
    }

    const token = signMatchSharePayload({
      client_id: resolvedClientId,
      user_id,
      lead: lead || {},
      requirements: requirements || {},
    });

    return NextResponse.json({ status: true, data: { token, source: "bff" } });
  } catch (e) {
    return NextResponse.json(
      { status: false, message: e?.message || "Failed to create share link" },
      { status: 500 }
    );
  }
}
