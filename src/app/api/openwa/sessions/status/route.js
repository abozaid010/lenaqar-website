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
  summarizeOpenwaBulkPayloadForLog,
  summarizeResolvedSessionsForLog,
} from "@/lib/openwa-session-status";

const OPENWA_SESSION_API_KEY = (
  process.env.OPENWA_SESSION_API_KEY ??
  process.env.X_API_KEY ??
  ""
).trim();

const IS_DEV = process.env.NODE_ENV === "development";

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
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    logOpenwaConnectionTrace("bff.start", {
      requestId,
      apiBaseUrl: API_BASE_URL,
      hasOpenwaKey: Boolean(OPENWA_SESSION_API_KEY),
    });

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
      logOpenwaConnectionTrace("bff.unauthorized", { requestId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENWA_SESSION_API_KEY) {
      logOpenwaConnectionTrace("bff.missing_openwa_key", { requestId });
      return NextResponse.json(
        { error: "OpenWA session API is not configured" },
        { status: 503 }
      );
    }

    const profileResult = await fetchProfileLinkedWhatsapp(accessToken);
    if (profileResult.error) {
      logOpenwaConnectionTrace("bff.profile_failed", {
        requestId,
        error: profileResult.error,
        status: profileResult.status,
      });
      return NextResponse.json(
        { error: profileResult.error },
        { status: profileResult.status || 500 }
      );
    }

    const profileAccounts = getOpenwaProfileAccounts(profileResult.linked);
    logOpenwaConnectionTrace("bff.profile_accounts", {
      requestId,
      count: profileAccounts.length,
      accounts: profileAccounts.map((account) => ({
        session_id: account.session_id || null,
        whatsapp_number: account.whatsapp_number || null,
        lookupKey: account.lookupKey,
      })),
    });

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
    const bulkSummary = summarizeOpenwaBulkPayloadForLog(bulkPayload);
    logOpenwaConnectionTrace("bff.bulk_status", {
      requestId,
      endpoint: `${API_BASE_URL}/webhook/openwa/sessions/status`,
      sessions: bulkSummary,
    });

    const { sessions: bulkSessions, allConnected, matches } =
      resolveOpenwaStatusesFromBulk(profileAccounts, bulkPayload);

    logOpenwaConnectionTrace("bff.bulk_resolution", {
      requestId,
      matches,
      sessions: summarizeResolvedSessionsForLog(bulkSessions),
    });

    const { sessions, singleFetches } = await enrichOpenwaSessionsWithSingleStatus(
      bulkSessions,
      API_BASE_URL,
      OPENWA_SESSION_API_KEY
    );

    if (singleFetches.length > 0) {
      logOpenwaConnectionTrace("bff.single_status_fallback", {
        requestId,
        endpoint: `${API_BASE_URL}/webhook/openwa/session/status`,
        fetches: singleFetches,
      });
    }

    const resolvedSummary = summarizeResolvedSessionsForLog(sessions);
    logOpenwaConnectionTrace("bff.resolved", {
      requestId,
      allConnected: sessions.every((session) => session.connected),
      sessions: resolvedSummary,
    });

    const responseBody = {
      sessions,
      allConnected: sessions.every((session) => session.connected),
      hasOpenwaAccounts: true,
    };

    if (IS_DEV) {
      responseBody._trace = {
        requestId,
        apiBaseUrl: API_BASE_URL,
        profileAccounts: profileAccounts.map((account) => ({
          session_id: account.session_id || null,
          whatsapp_number: account.whatsapp_number || null,
        })),
        bulkSummary,
        matches,
        singleFetches,
        resolvedSummary,
      };
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    logOpenwaConnectionTrace("bff.error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
      status: error?.status ?? 500,
    });
    return upstreamErrorResponse(error);
  }
}
