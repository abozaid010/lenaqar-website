import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { signMatchSharePayload } from "@/lib/match/share-token-server";
import { API_BASE_URL } from "@/lib/apiConfig";

/**
 * POST /api/match/share
 * Creates a share token (proxies to backend when available, else signed BFF token).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { client_id, user_id, lead, requirements } = body || {};

    if (!user_id) {
      return NextResponse.json(
        { status: false, message: "user_id is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
    const resolvedClientId =
      client_id || cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || "";

    // Try backend share API first
    try {
      const headers = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      if (resolvedClientId) headers["x-client-id"] = resolvedClientId;

      const backendRes = await fetch(`${API_BASE_URL}/match/share/v1`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          client_id: resolvedClientId,
          user_id,
          lead,
          requirements,
        }),
        cache: "no-store",
      });

      if (backendRes.ok) {
        const json = await backendRes.json();
        const token = json?.data?.token || json?.data?.share_token || json?.token;
        if (token) {
          return NextResponse.json({
            status: true,
            data: { token, source: "backend" },
          });
        }
      }
    } catch {
      // fall through to BFF token
    }

    const token = signMatchSharePayload({
      client_id: resolvedClientId,
      user_id,
      lead: lead || {},
      requirements: requirements || {},
    });

    return NextResponse.json({
      status: true,
      data: { token, source: "bff" },
    });
  } catch (e) {
    return NextResponse.json(
      { status: false, message: e?.message || "Failed to create share link" },
      { status: 500 },
    );
  }
}
