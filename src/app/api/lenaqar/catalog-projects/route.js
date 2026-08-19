import { NextResponse } from "next/server";
import { fetchPublicCatalogProjectNames } from "@/lib/lenaqar/project-names.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchPublicCatalogProjectNames();
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error(
      "[lenaqar] catalog-projects failed",
      error?.code || error?.message,
    );
    return NextResponse.json({ data: [] });
  }
}
