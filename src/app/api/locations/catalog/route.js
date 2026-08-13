import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import {
  clearLocationsCatalogCache,
  getLocationsCatalog,
  peekLocationsCatalogCache,
} from "@/lib/locations/locations-catalog.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/locations/catalog
 * Auth preferred. If unauthenticated but server cache is warm, serve it
 * (public label pages). Otherwise 401.
 */
export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

  try {
    if (accessToken) {
      const catalog = await getLocationsCatalog();
      return NextResponse.json(catalog, {
        headers: {
          "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    const isLenaqar =
      (process.env.NEXT_PUBLIC_SITE_BRAND || "").trim() === "lenaqar";
    if (isLenaqar) {
      try {
        const { getLenaqarTenantSession } = await import(
          "@/lib/lenaqar/tenant-session.server"
        );
        const { accessToken: tenantToken } = await getLenaqarTenantSession();
        const catalog = await getLocationsCatalog({ authToken: tenantToken });
        return NextResponse.json(catalog, {
          headers: {
            "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
          },
        });
      } catch (error) {
        console.error(
          "[locations/catalog] lenaqar tenant catalog failed:",
          error?.code || error?.message,
        );
      }
    }

    const warm = peekLocationsCatalogCache();
    if (warm) {
      return NextResponse.json(warm, {
        headers: {
          "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error(
      "[locations/catalog] failed:",
      error?.response?.status || error?.message || error
    );
    const warm = peekLocationsCatalogCache();
    if (warm) {
      return NextResponse.json(warm, {
        headers: { "Cache-Control": "private, max-age=60" },
      });
    }
    return NextResponse.json(
      { error: "Failed to load locations catalog" },
      { status: 502 }
    );
  }
}

/**
 * DELETE /api/locations/catalog — drop server in-memory cache (after admin edits).
 */
export async function DELETE() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  clearLocationsCatalogCache();
  return NextResponse.json({ status: true, cleared: true });
}
