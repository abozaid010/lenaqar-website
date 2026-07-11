import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { logOpenwaConnectionTrace } from "@/lib/openwa-session-status";

/**
 * BFF route for GET /api/openwa/status?whatsapp_number=....
 *
 * Polled every ~2s by the reconnect dialog while a session is starting.
 * Same session-id resolution and auth rules as POST /api/openwa/reconnect.
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
      logOpenwaConnectionTrace("status.unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whatsappNumber = new URL(request.url).searchParams
      .get("whatsapp_number")
      ?.trim();

    if (!whatsappNumber) {
      return NextResponse.json(
        { error: "whatsapp_number is required" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ whatsapp_number: whatsappNumber });
    const response = await bffFetch(
      `${API_BASE_URL}/client/v1/whatsapp/openwa/status?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.detail || data?.error || data?.message || "Failed to check WhatsApp connection status";
      logOpenwaConnectionTrace("status.upstream_failed", { status: response.status });
      return NextResponse.json(
        { error: typeof message === "string" ? message : "Failed to check WhatsApp connection status" },
        { status: response.status }
      );
    }

    return NextResponse.json(data?.data ?? {});
  } catch (error) {
    console.error(
      "Failed to check OpenWA reconnect status:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
