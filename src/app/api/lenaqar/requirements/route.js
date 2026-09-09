import { NextResponse } from "next/server";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";

export const dynamic = "force-dynamic";

/**
 * Public-safe requirements feed. Response is already allowlisted server-side —
 * never proxy raw CRM rows.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 48);

    const { requirements, error } = await fetchPublicRequirements({ limit });
    // Public marketplace is buy-request only (sell/rent already dropped upstream).
    const filtered = requirements.filter((row) => row.intent === "buy");

    return NextResponse.json(
      { data: { requirements: filtered, error } },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error(
      "[lenaqar] public requirements route failed",
      error?.message || error,
    );
    return NextResponse.json(
      { data: { requirements: [], error: "unavailable" } },
      { status: 200 },
    );
  }
}
