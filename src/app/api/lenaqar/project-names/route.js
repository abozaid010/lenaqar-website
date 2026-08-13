import { NextResponse } from "next/server";
import { fetchLenaqarProjectNames } from "@/lib/lenaqar/project-names.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const isLenaqar =
    (process.env.NEXT_PUBLIC_SITE_BRAND || "").trim() === "lenaqar";
  if (!isLenaqar) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await fetchLenaqarProjectNames();
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
      "[lenaqar] project-names failed",
      error?.code || error?.message,
    );
    return NextResponse.json({ data: [] });
  }
}
