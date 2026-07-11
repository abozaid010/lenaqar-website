import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { isRequestFromKingAdmin } from "@/lib/kingAdmin";
import { bffFetch } from "@/lib/bffFetch";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

export async function GET(request) {
  try {
    if (!(await isRequestFromKingAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized. King admin access required." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const page_size = searchParams.get("page_size") || "20";
    const search = searchParams.get("search")?.trim() || "";

    const backendParams = new URLSearchParams({
      page,
      page_size,
    });
    if (search) {
      backendParams.set("search", search);
    }

    const response = await bffFetch(
      `${API_BASE_URL}/client/admin/clients?${backendParams.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to fetch clients" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin-clients] GET error:", error?.message ?? error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
