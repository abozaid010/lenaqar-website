import { NextResponse } from "next/server";
import {
  clearLocationsCatalogCache,
  getLocationsCatalog,
  peekLocationsCatalogCache,
} from "@/lib/locations/locations-catalog.server";

export const dynamic = "force-dynamic";

function catalogResponse(catalog, maxAge = 3600) {
  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": `private, max-age=${maxAge}, stale-while-revalidate=86400`,
    },
  });
}

/**
 * GET /api/locations/catalog
 * Public LenaQar site: anonymous market-index via X-API-Key (no login).
 * Falls back to warm server cache when the upstream API is temporarily down.
 */
export async function GET() {
  try {
    const catalog = await getLocationsCatalog({ usePublicEndpoint: true });
    return catalogResponse(catalog);
  } catch (error) {
    console.error(
      "[locations/catalog] public catalog failed:",
      error?.code || error?.message,
    );

    const warm = peekLocationsCatalogCache();
    if (warm) {
      return catalogResponse(warm, 60);
    }

    return NextResponse.json(
      { error: "Failed to load locations catalog" },
      { status: 502 },
    );
  }
}

/** Drop server in-memory cache (after admin edits or manual bust). */
export async function DELETE() {
  clearLocationsCatalogCache();
  return NextResponse.json({ status: true, cleared: true });
}
