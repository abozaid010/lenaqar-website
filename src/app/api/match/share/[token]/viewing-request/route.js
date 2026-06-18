import { NextResponse } from "next/server";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { addViewingRequest } from "@/lib/match/share-token-server";
import { bffFetch } from "@/lib/bffFetch";

/**
 * POST /api/match/share/[token]/viewing-request
 * Body: { unit_ids: string[], meeting_time: string }
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const unitIds = body?.unit_ids ?? body?.unitIds ?? [];
    const meetingTime = body?.meeting_time ?? body?.meetingTime;

    if (!token) {
      return NextResponse.json(
        { status: false, message: "token is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json(
        { status: false, message: "Select at least one unit" },
        { status: 400 },
      );
    }
    if (!meetingTime) {
      return NextResponse.json(
        { status: false, message: "meeting_time is required" },
        { status: 400 },
      );
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        accept: "application/json",
      };
      if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

      const res = await bffFetch(
        `${API_BASE_URL}/match/share/v1/${encodeURIComponent(token)}/viewing-request`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            unit_ids: unitIds,
            meeting_time: meetingTime,
          }),
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

    const record = addViewingRequest(token, {
      unit_ids: unitIds.map(String),
      meeting_time: meetingTime,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: true,
      data: { viewing_requests: record.viewingRequests },
    });
  } catch (e) {
    return NextResponse.json(
      { status: false, message: e?.message || "Failed to submit viewing request" },
      { status: 500 },
    );
  }
}
