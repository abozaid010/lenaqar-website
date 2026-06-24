/**
 * Catch-all BFF proxy for all CRM backend calls.
 *
 * Security properties:
 *  - Backend URL never reaches the browser
 *  - Auth token read from httpOnly cookie server-side
 *  - X-API-Key added server-side for /public/* paths
 *  - Unauthenticated requests are rejected before hitting the backend (except
 *    /public/* which the backend permits with X-API-Key only)
 *  - Rate limited: 300 requests / 60 s per IP (in-memory, per server instance)
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axiosInstance from "@/utils/axiosInstance";
import { PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rateLimit";

const BFF_RATE_LIMIT = 300; // requests
const BFF_WINDOW_MS = 60_000; // 60 seconds

/**
 * FastAPI collection roots that require a trailing slash (Next.js strips it from /api/crm/*).
 * Only exact paths listed here — item routes like /payment-plans/{id} are unchanged.
 */
const BACKEND_COLLECTION_PATHS = new Set(["/payment-plans"]);

function buildBackendUrl(backendPath, searchParams) {
  const path = BACKEND_COLLECTION_PATHS.has(backendPath)
    ? `${backendPath}/`
    : backendPath;
  const qs = searchParams.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}

async function parseProxyBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const raw = await request.text().catch(() => "");
    if (!raw.trim()) return { body: undefined, multipart: false };
    try {
      return { body: JSON.parse(raw), multipart: false };
    } catch {
      return { body: {}, multipart: false };
    }
  }
  if (contentType.includes("multipart/form-data")) {
    return { body: null, multipart: true };
  }
  const text = await request.text().catch(() => "");
  return { body: text || undefined, multipart: false };
}

async function handleRequest(request, context) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const { allowed, retryAfter } = rateLimit(`bff:${ip}`, BFF_RATE_LIMIT, BFF_WINDOW_MS);
  if (!allowed) return rateLimitExceededResponse(retryAfter);

  const { path: pathSegments } = await context.params;
  const backendPath = "/" + pathSegments.join("/");
  const { searchParams } = new URL(request.url);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  // /public/* endpoints are intentionally unauthenticated (X-API-Key only).
  // Every other CRM path requires a valid session cookie.
  const isPublicPath =
    backendPath.startsWith("/public/") ||
    backendPath.startsWith("/campaign/") ||
    backendPath.startsWith("/whatsapp/");

  if (!isPublicPath) {
    const cookieStore = await cookies();
    const hasSession =
      cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value ||
      cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
    if (!hasSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── Extra headers ──────────────────────────────────────────────────────────
  const extraHeaders = {};
  if (PUBLIC_X_API_KEY && isPublicPath) {
    extraHeaders["X-API-Key"] = PUBLIC_X_API_KEY;
  }

  const method = request.method.toLowerCase();
  const url = buildBackendUrl(backendPath, searchParams);

  // Check if this is the import units endpoint that needs longer timeout
  const isImportUnitsEndpoint = backendPath === "/units/v2/import_units_by_developer";
  const longTimeout = 300000; // 5 minutes

  try {
    let response;
    const config = { headers: extraHeaders };
    
    if (isImportUnitsEndpoint) {
      config.timeout = longTimeout;
    }

    if (method === "get") {
      response = await axiosInstance.get(url, config);
    } else {
      const { body, multipart } = await parseProxyBody(request);
      if (multipart) {
        return NextResponse.json({ error: "Use /api/upload for file uploads" }, { status: 400 });
      }

      if (method === "delete") {
        if (body !== undefined) config.data = body;
        response = await axiosInstance.delete(url, config);
      } else {
        response = await axiosInstance[method](url, body, config);
      }
    }

    return NextResponse.json(response.data, { status: response.status || 200 });
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { error: "Backend error", detail: error?.message };
    return NextResponse.json(data, { status });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
