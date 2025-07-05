import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";

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
    const response = await fetch(`${BASE_URL}/client/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    // Set the new token in cookies
    const responseObj = NextResponse.json({ access_token: newAccessToken });
    responseObj.cookies.set("access_token", newAccessToken, {
      path: "/",
      secure: true,
      httpOnly: false,
    });

    return responseObj;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 401 }
    );
  }
}
