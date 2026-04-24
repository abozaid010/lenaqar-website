import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { isRequestFromKingAdmin } from "@/lib/kingAdmin";

export async function PATCH(request, { params }) {
  try {
    if (!isRequestFromKingAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized. King admin access required." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    const { clientId } = await params;
    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/client/admin/clients/${clientId}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to update client" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin-clients] PATCH error:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
