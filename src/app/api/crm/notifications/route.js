import { NextResponse } from "next/server";
import axiosInstance from "@/utils/axiosInstance";

/**
 * BFF proxy for notifications.
 * The client hook calls `/api/crm/notifications` (same-origin) instead of the
 * backend directly — the backend URL never appears in the browser Network tab.
 *
 * Supported query params (forwarded to backend):
 *   limit      - number of notifications (default 50)
 *   since      - ISO timestamp for incremental poll
 *   unread_only - "true" to return only unread
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    const limit = searchParams.get("limit") || "50";
    params.set("limit", limit);

    const since = searchParams.get("since");
    if (since) params.set("since", since);

    const unreadOnly = searchParams.get("unread_only");
    if (unreadOnly) params.set("unread_only", unreadOnly);

    const response = await axiosInstance.get(`/notifications?${params.toString()}`);

    if (!response.data?.status || !response.data?.data) {
      return NextResponse.json(
        { error: "Invalid response from backend" },
        { status: 502 }
      );
    }

    const { notifications, unread_count } = response.data.data;
    if (!Array.isArray(notifications)) {
      return NextResponse.json(
        { error: "Unexpected notifications format" },
        { status: 502 }
      );
    }

    return NextResponse.json({ notifications, unread_count: unread_count ?? 0 });
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * Mark a single notification as read.
 * Body: { notificationId: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      const response = await axiosInstance.post("/notifications/read-all");
      return NextResponse.json({ ok: response.data?.status ?? true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId required" }, { status: 400 });
    }

    const response = await axiosInstance.post(
      `/notifications/${encodeURIComponent(notificationId)}/read`
    );
    return NextResponse.json({ ok: response.data?.status ?? true });
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
