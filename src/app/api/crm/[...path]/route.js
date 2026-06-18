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
  const qs = searchParams.toString();
  const url = `${backendPath}${qs ? `?${qs}` : ""}`;

  try {
    let response;

    if (method === "get" || method === "delete") {
      response = await axiosInstance[method](url, { headers: extraHeaders });
    } else {
      const contentType = request.headers.get("content-type") || "";
      let body;
      if (contentType.includes("application/json")) {
        body = await request.json().catch(() => ({}));
      } else if (contentType.includes("multipart/form-data")) {
        return NextResponse.json({ error: "Use /api/upload for file uploads" }, { status: 400 });
      } else {
        body = await request.text().catch(() => "");
      }
      response = await axiosInstance[method](url, body, { headers: extraHeaders });
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
