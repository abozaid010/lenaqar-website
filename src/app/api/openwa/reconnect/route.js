import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { logOpenwaConnectionTrace } from "@/lib/openwa-session-status";

/**
 * BFF route for POST /api/openwa/reconnect.
 *
 * Starts (or restarts) the caller's own OpenWA session. The backend resolves
 * the OpenWA session id server-side from the authenticated client's linked
 * accounts — this route only ever forwards the client's own whatsapp_number,
 * never a session id, and never talks to OpenWA directly.
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
      logOpenwaConnectionTrace("reconnect.unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const whatsappNumber =
      typeof body?.whatsapp_number === "string" ? body.whatsapp_number.trim() : "";

    if (!whatsappNumber) {
      return NextResponse.json(
        { error: "whatsapp_number is required" },
        { status: 400 }
      );
    }

    const response = await bffFetch(
      `${API_BASE_URL}/client/v1/whatsapp/openwa/reconnect`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ whatsapp_number: whatsappNumber }),
        signal: AbortSignal.timeout(25000),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.detail || data?.error || data?.message || "Failed to start WhatsApp reconnection";
      logOpenwaConnectionTrace("reconnect.upstream_failed", { status: response.status });
      return NextResponse.json(
        { error: typeof message === "string" ? message : "Failed to start WhatsApp reconnection" },
        { status: response.status }
      );
    }

    return NextResponse.json(data?.data ?? {});
  } catch (error) {
    console.error(
      "Failed to start OpenWA reconnect:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
