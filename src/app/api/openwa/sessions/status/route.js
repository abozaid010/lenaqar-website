import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import {
  enrichOpenwaSessionsWithSingleStatus,
  fetchBulkOpenwaSessionsStatus,
  getOpenwaProfileAccounts,
  logOpenwaConnectionTrace,
  resolveOpenwaStatusesFromBulk,
} from "@/lib/openwa-session-status";

/**
 * CloudAPI lock for GET /webhook/openwa/session(s)/status (X-API-Key).
 * Not OPENWA_API_KEY — that key is CloudAPI → OpenWA REST only.
 */
const OPENWA_SESSION_API_KEY = (
  process.env.OPENWA_SESSION_API_KEY ?? ""
).trim();

async function fetchProfileLinkedWhatsapp(accessToken) {
  const response = await bffFetch(`${API_BASE_URL}/client/v1/profile`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      data?.message ||
      "Failed to load profile";
    return {
      error:
        typeof message === "string" ? message : "Failed to load profile",
      status: response.status,
    };
  }

  return {
    linked: data?.data?.linked_automated_whatsapp ?? null,
  };
}

function upstreamErrorResponse(error) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const status =
    typeof error?.status === "number" && error.status >= 400
      ? error.status
      : 500;

  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
      logOpenwaConnectionTrace("bff.unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENWA_SESSION_API_KEY) {
      logOpenwaConnectionTrace("bff.missing_openwa_session_key");
      return NextResponse.json(
        { error: "OpenWA session API is not configured" },
        { status: 503 }
      );
    }

    const profileResult = await fetchProfileLinkedWhatsapp(accessToken);
    if (profileResult.error) {
      logOpenwaConnectionTrace("bff.profile_failed", {
        message: profileResult.error,
        status: profileResult.status,
      });
      return NextResponse.json(
        { error: profileResult.error },
        { status: profileResult.status || 500 }
      );
    }

    const profileAccounts = getOpenwaProfileAccounts(profileResult.linked);

    if (profileAccounts.length === 0) {
      return NextResponse.json({
        sessions: [],
        allConnected: true,
        hasOpenwaAccounts: false,
      });
    }

    const bulkPayload = await fetchBulkOpenwaSessionsStatus(
      API_BASE_URL,
      OPENWA_SESSION_API_KEY
    );

    const { sessions: bulkSessions } =
      resolveOpenwaStatusesFromBulk(profileAccounts, bulkPayload);

    const { sessions } = await enrichOpenwaSessionsWithSingleStatus(
      bulkSessions,
      API_BASE_URL,
      OPENWA_SESSION_API_KEY
    );

    return NextResponse.json({
      sessions,
      allConnected: sessions.every((session) => session.connected),
      hasOpenwaAccounts: true,
    });
  } catch (error) {
    console.error(
      "Failed to load OpenWA session status:",
      error instanceof Error ? error.message : String(error)
    );
    return upstreamErrorResponse(error);
  }
}
