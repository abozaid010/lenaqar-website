import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rateLimit";

const BFF_RATE_LIMIT = 300;
const BFF_WINDOW_MS = 60_000;

function buildUpstreamUrl(pathname: string, searchParams: URLSearchParams) {
  const qs = searchParams.toString();
  return `${API_BASE_URL.replace(/\/+$/, "")}${pathname}${qs ? `?${qs}` : ""}`;
}

async function handleRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const ip = getClientIp(request);
  const { allowed, retryAfter } = rateLimit(
    `bff:social-media:${ip}`,
    BFF_RATE_LIMIT,
    BFF_WINDOW_MS
  );
  if (!allowed) return rateLimitExceededResponse(retryAfter);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  // Upstream social monitoring API: GET /posts, /comments, /dashboard/summary (Bearer auth).
  const upstreamPath = `/${path.join("/")}`;

  const url = new URL(request.url);
  const upstreamUrl = buildUpstreamUrl(upstreamPath, url.searchParams);

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");

  const contentType = request.headers.get("content-type") || "";
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const method = request.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await request.text().catch(() => "") : undefined;

    const upstreamRes = await fetch(upstreamUrl, {
      method,
      headers,
      body: hasBody ? body : undefined,
      cache: "no-store",
    });

    const text = await upstreamRes.text();
    const isJson = String(upstreamRes.headers.get("content-type") || "").includes(
      "application/json"
    );

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "content-type": isJson ? "application/json" : "text/plain",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Upstream error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
