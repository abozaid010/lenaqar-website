import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerCookieOptions } from "@/lib/CookieConfig";
import { API_BASE_URL } from "@/lib/apiConfig";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { bffFetch } from "@/lib/bffFetch";
import { decodeJwtExp, extractAuthTokens } from "@/lib/jwtCookieUtils";
import { withRefreshSingleFlight } from "@/lib/refreshTokenInflight";

/**
 * Distinguishes "the backend explicitly rejected the refresh token" (session is
 * genuinely invalid) from "we couldn't reach/complete the backend call" (network
 * error, timeout, 5xx — transient, not proof the refresh token is bad).
 */
class RefreshFailedError extends Error {
  constructor(message, { transient = false } = {}) {
    super(message);
    this.name = "RefreshFailedError";
    this.transient = transient;
  }
}

/**
 * Single attempt against the backend refresh endpoint.
 * @param {string} refreshToken
 * @returns {Promise<{ newAccessToken: string, newRefreshToken?: string }>}
 */
async function callRefreshEndpoint(refreshToken) {
  let response;
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/client/refresh-token`;
    response = await bffFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (fetchError) {
    // Couldn't reach the backend at all (timeout, DNS, connection reset) —
    // this says nothing about whether the refresh token is valid.
    throw new RefreshFailedError(
      `Backend API unavailable at ${API_BASE_URL}: ${fetchError?.message ?? fetchError}`,
      { transient: true }
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    // 401/403 = backend explicitly rejected the refresh token → genuinely invalid session.
    // Anything else (5xx, etc.) is a backend hiccup, not proof of an invalid session.
    const transient = response.status !== 401 && response.status !== 403;
    throw new RefreshFailedError(`Token refresh failed with status ${response.status}`, {
      transient,
    });
  }

  if (body?.status === false || (typeof body?.code === "number" && body.code >= 400)) {
    const transient = typeof body?.code === "number" && body.code >= 500;
    throw new RefreshFailedError(
      body.error_message || `Token refresh failed with code ${body.code}`,
      { transient }
    );
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    extractAuthTokens(body);

  if (!newAccessToken) {
    throw new RefreshFailedError("No access token received from refresh endpoint");
  }

  return { newAccessToken, newRefreshToken };
}

/**
 * Retries once on a transient failure (network/timeout/5xx) before giving up.
 * Never retries an explicit auth rejection — that's already a final answer.
 */
async function refreshWithRetry(refreshToken) {
  try {
    return await callRefreshEndpoint(refreshToken);
  } catch (error) {
    if (!error.transient) throw error;
    await new Promise((resolve) => setTimeout(resolve, 400));
    return callRefreshEndpoint(refreshToken);
  }
}

/**
 * Shared refresh logic: read refresh_token from cookies, call backend, return new tokens.
 * @returns {Promise<{ newAccessToken: string, newRefreshToken?: string }>}
 * @throws {RefreshFailedError} When refresh fails
 */
async function performRefresh() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    throw new RefreshFailedError("No refresh token found");
  }

  return withRefreshSingleFlight(refreshToken, () => refreshWithRetry(refreshToken));
}

/**
 * Apply token cookies to a NextResponse (shared by POST and GET handlers).
 */
function setTokenCookies(responseObj, newAccessToken, newRefreshToken) {
  const accessTokenOptions = getServerCookieOptions("ACCESS_TOKEN");
  const refreshTokenOptions = getServerCookieOptions("REFRESH_TOKEN");

  responseObj.cookies.set(COOKIE_KEYS.ACCESS_TOKEN, newAccessToken, accessTokenOptions);
  if (newRefreshToken) {
    responseObj.cookies.set(COOKIE_KEYS.REFRESH_TOKEN, newRefreshToken, refreshTokenOptions);
  }

  const exp = decodeJwtExp(newAccessToken);
  if (exp !== null) {
    responseObj.cookies.set(
      COOKIE_KEYS.ACCESS_TOKEN_EXP,
      String(exp),
      getServerCookieOptions("ACCESS_TOKEN_EXP")
    );
  }
}

export async function POST() {
  try {
    const { newAccessToken, newRefreshToken } = await performRefresh();

    const responseObj = NextResponse.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
    setTokenCookies(responseObj, newAccessToken, newRefreshToken);

    return responseObj;
  } catch (error) {
    console.error("[refresh-token] Token refresh failed:", error?.message ?? error);
    const transient = !!error?.transient;
    // 503 = we couldn't complete the refresh (retryable); 401 = refresh token is genuinely invalid.
    return NextResponse.json(
      { error: "Token refresh failed", transient },
      { status: transient ? 503 : 401 }
    );
  }
}

const SITE_HOME_PAGE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lenaqar.com";

/**
 * GET handler for middleware redirect flow: refresh token, set cookies, redirect back.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const safeRedirect =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : "/dashboard";

  try {
    const { newAccessToken, newRefreshToken } = await performRefresh();

    const redirectUrl = new URL(safeRedirect, SITE_HOME_PAGE);
    const responseObj = NextResponse.redirect(redirectUrl);
    setTokenCookies(responseObj, newAccessToken, newRefreshToken);

    return responseObj;
  } catch (error) {
    console.error("[refresh-token] GET token refresh failed:", error?.message ?? error);

    if (error?.transient) {
      // Couldn't complete the refresh (network/timeout/backend hiccup) — this is not
      // proof the refresh token is invalid, so don't log the user out. Send them back
      // to the page with a marker that tells the middleware to skip another server-side
      // refresh redirect; the client-side refresh (TokenRefreshProvider / axios
      // interceptor) will retry independently once the backend/network recovers.
      const fallbackUrl = new URL(safeRedirect, SITE_HOME_PAGE);
      fallbackUrl.searchParams.set("authRetry", "1");
      return NextResponse.redirect(fallbackUrl);
    }

    return NextResponse.redirect(new URL("/login", SITE_HOME_PAGE));
  }
}
