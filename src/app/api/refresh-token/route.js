import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerCookieOptions } from "@/lib/CookieConfig";

const getBaseUrl = () => {
  const url = process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api.lenaai.net";
  return url.startsWith("http") ? url : `https://${url}`;
};

const BASE_URL = getBaseUrl();

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      );
    }

    // Make server-to-server request (no CORS issues)
    const response = await fetch(`${BASE_URL}/client/refresh-token?refresh_token=${refreshToken}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    if (!newAccessToken) {
      throw new Error("No access token received from refresh endpoint");
    }

    // Set the new token in cookies with all required options
    // Using centralized CookieConfig ensures consistency
    const cookieOptions = getServerCookieOptions("ACCESS_TOKEN");
    const responseObj = NextResponse.json({ access_token: newAccessToken });
    responseObj.cookies.set("access_token", newAccessToken, cookieOptions);

    return responseObj;
  } catch (error) {
    // Log error details only in development, avoid exposing sensitive info in production
    if (process.env.NODE_ENV === "development") {
      console.error("[refresh-token] Token refresh failed:", error);
    }
    // Return generic error message to avoid information leakage
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 401 }
    );
  }
}
