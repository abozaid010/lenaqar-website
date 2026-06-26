import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import {
  fetchOpenwaSessionStatusFromBackend,
  getOpenwaProfileAccounts,
  mergeOpenwaSessionStatuses,
  resolveOpenwaSessionIds,
} from "@/lib/openwa-session-status";

const OPENWA_SESSION_API_KEY = (
  process.env.OPENWA_SESSION_API_KEY ??
  process.env.X_API_KEY ??
  ""
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
    const refreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENWA_SESSION_API_KEY) {
      return NextResponse.json(
        { error: "OpenWA session API is not configured" },
        { status: 503 }
      );
    }

    const profileResult = await fetchProfileLinkedWhatsapp(accessToken);
    if (profileResult.error) {
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

    const resolvedAccounts = await resolveOpenwaSessionIds(
      profileAccounts,
      API_BASE_URL,
      OPENWA_SESSION_API_KEY
    );

    const statusByKey = {};

    await Promise.all(
      resolvedAccounts.map(async (account) => {
        const storeKey = account.session_id || account.lookupKey;

        if (!account.session_id) {
          statusByKey[storeKey] = {
            connected: false,
            status: "error",
            error: "OpenWA session ID is not available for this number",
          };
          return;
        }

        try {
          const status = await fetchOpenwaSessionStatusFromBackend(
            API_BASE_URL,
            account.session_id,
            OPENWA_SESSION_API_KEY
          );
          statusByKey[account.session_id] = status;
        } catch (error) {
          statusByKey[storeKey] = {
            connected: false,
            status: "error",
            error:
              error?.message || "Failed to fetch OpenWA session status",
          };
        }
      })
    );

    const sessions = mergeOpenwaSessionStatuses(resolvedAccounts, statusByKey);
    const allConnected = sessions.every((session) => session.connected);

    return NextResponse.json({
      sessions,
      allConnected,
      hasOpenwaAccounts: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[openwa/sessions/status] GET error:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
