import { NextResponse } from "next/server";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { setUnitReaction } from "@/lib/match/share-token-server";

/**
 * PUT /api/match/share/[token]/reactions
 * Body: { unit_id, liked: boolean }
 */
export async function PUT(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const unitId = body?.unit_id ?? body?.unitId;
    const liked = Boolean(body?.liked);

    if (!token || !unitId) {
      return NextResponse.json(
        { status: false, message: "token and unit_id are required" },
        { status: 400 },
      );
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

      const res = await fetch(
        `${API_BASE_URL}/match/share/v1/${encodeURIComponent(token)}/reactions`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ unit_id: unitId, liked }),
          cache: "no-store",
        },
      );

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json({ status: true, data: json?.data ?? json });
      }
    } catch {
      // BFF fallback
    }

    const interactions = setUnitReaction(token, String(unitId), liked);
    return NextResponse.json({
      status: true,
      data: { liked_unit_ids: interactions.likedUnitIds },
    });
  } catch (e) {
    return NextResponse.json(
      { status: false, message: e?.message || "Failed to save reaction" },
      { status: 500 },
    );
  }
}
