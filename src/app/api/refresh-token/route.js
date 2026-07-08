import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerCookieOptions } from "@/lib/CookieConfig";
import { API_BASE_URL } from "@/lib/apiConfig";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { bffFetch } from "@/lib/bffFetch";
import { decodeJwtExp, extractAuthTokens } from "@/lib/jwtCookieUtils";
import { withRefreshSingleFlight } from "@/lib/refreshTokenInflight";

/**
 * Shared refresh logic: read refresh_token from cookies, call backend, return new tokens.
 * @returns {Promise<{ newAccessToken: string, newRefreshToken?: string }>}
 * @throws {Error} When refresh fails
 */
async function performRefresh() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  return withRefreshSingleFlight(refreshToken, async () => {
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
      if (fetchError.code === "ECONNREFUSED" || fetchError.name === "AbortError") {
        throw new Error(
          `Backend API unavailable at ${API_BASE_URL}. Please check if the server is running.`
        );
      }
      throw fetchError;
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Token refresh failed with status ${response.status}`);
    }

    if (body?.status === false || (typeof body?.code === "number" && body.code >= 400)) {
      throw new Error(body.error_message || `Token refresh failed with code ${body.code}`);
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      extractAuthTokens(body);

    if (!newAccessToken) {
      throw new Error("No access token received from refresh endpoint");
    }

    return { newAccessToken, newRefreshToken };
  });
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
    if (process.env.NODE_ENV === "development") {
      console.error("[refresh-token] Token refresh failed:", error);
    }
    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  }
}

const SITE_HOME_PAGE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.lenaai.net";

/**
 * GET handler for middleware redirect flow: refresh token, set cookies, redirect back.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectPath = searchParams.get("redirect") || "/dashboard";

    const safeRedirect =
      redirectPath.startsWith("/") && !redirectPath.startsWith("//")
        ? redirectPath
        : "/dashboard";

    const { newAccessToken, newRefreshToken } = await performRefresh();

    const redirectUrl = new URL(safeRedirect, SITE_HOME_PAGE);
    const responseObj = NextResponse.redirect(redirectUrl);
    setTokenCookies(responseObj, newAccessToken, newRefreshToken);

    return responseObj;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[refresh-token] GET token refresh failed:", error);
    }
    return NextResponse.redirect(new URL("/login", SITE_HOME_PAGE));
  }
}
