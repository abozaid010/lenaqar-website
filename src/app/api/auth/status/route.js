/**
 * DEV-ONLY auth diagnostic endpoint to verify middleware + token refresh.
 *
 * Returns 404 in production. Never returns token values — only presence,
 * expiry, and decoded non-sensitive claims (role, client_id, exp).
 *
 *   GET /api/auth/status
 *     → snapshot of cookie/token state (is the access token expired? when?)
 *
 *   GET /api/auth/status?action=expire-access
 *     → deletes the access_token cookie (keeps refresh_token), so the next
 *       navigation to a protected route triggers the middleware refresh bounce
 *       (/api/refresh-token?redirect=...). Use this to test the refresh flow.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const isProd = process.env.NODE_ENV === "production";

function decodeBase64UrlToString(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  if (typeof atob === "function") return atob(padded);
  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(decodeBase64UrlToString(parts[1]));
  } catch {
    return null;
  }
}

function buildSnapshot(cookieStore) {
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;

  const payload = decodeJwtPayload(accessToken);
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;

  return {
    cookies: {
      access_token: Boolean(accessToken),
      refresh_token: Boolean(refreshToken),
      client_id: Boolean(clientId),
    },
    accessToken: {
      present: Boolean(accessToken),
      decodable: Boolean(payload),
      role: payload?.role ?? payload?.client_type ?? null,
      client_id: payload?.client_id ?? null,
      exp,
      expiresInSeconds: exp != null ? exp - nowSec : null,
      expired: exp != null ? exp <= nowSec : null,
    },
    // What the middleware will do on the next protected-route navigation:
    middlewareWillRefresh: Boolean(refreshToken) && !accessToken,
    middlewareWillLogout: !refreshToken,
  };
}

export async function GET(request) {
  if (isProd) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cookieStore = await cookies();
  const action = new URL(request.url).searchParams.get("action");

  const snapshot = buildSnapshot(cookieStore);

  if (action === "expire-access") {
    const res = NextResponse.json({
      ok: true,
      action: "expire-access",
      message:
        "access_token cookie deleted. Navigate to a protected route to watch the middleware refresh bounce.",
      before: snapshot,
    });
    res.cookies.delete(COOKIE_KEYS.ACCESS_TOKEN);
    return res;
  }

  return NextResponse.json({ ok: true, ...snapshot });
}
