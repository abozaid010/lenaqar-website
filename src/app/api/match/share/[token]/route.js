import { NextResponse } from "next/server";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import {
  verifyMatchShareToken,
  getMatchInteractions,
} from "@/lib/match/share-token-server";
import { requirementToUnitsFilter } from "@/lib/match/requirement-to-units-filter";

/**
 * GET /api/match/share/[token]
 */
export async function GET(_request, { params }) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { status: false, message: "Token required" },
        { status: 400 },
      );
    }

    // Backend share context
    try {
      const headers = { accept: "application/json" };
      if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

      const res = await fetch(`${API_BASE_URL}/match/share/v1/${encodeURIComponent(token)}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        const data = json?.data ?? json;
        return NextResponse.json({ status: true, data: { ...data, source: "backend" } });
      }
    } catch {
      // BFF fallback
    }

    const payload = verifyMatchShareToken(token);
    if (!payload) {
      return NextResponse.json(
        { status: false, message: "Invalid or expired link" },
        { status: 404 },
      );
    }

    const { client_id, user_id, lead, requirements } = payload;
    const unitFilters = requirementToUnitsFilter(requirements, client_id);
    const interactions = getMatchInteractions(token);

    return NextResponse.json({
      status: true,
      data: {
        token,
        client_id,
        user_id,
        lead,
        requirements,
        unit_filters: unitFilters,
        liked_unit_ids: interactions.likedUnitIds || [],
        viewing_requests: interactions.viewingRequests || [],
        source: "bff",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { status: false, message: e?.message || "Failed to load share context" },
      { status: 500 },
    );
  }
}
