import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
    if (accessToken) {
      try {
        const data = await fetchLenaqarProjectNames({ authToken: accessToken });
        return NextResponse.json({ data });
      } catch (fallbackError) {
        console.error(
          "[lenaqar] project-names session fallback failed",
          fallbackError?.code || fallbackError?.message,
        );
      }
    }

    console.error(
      "[lenaqar] project-names failed",
      error?.code || error?.message,
    );
    return NextResponse.json({ data: [] });
  }
}
