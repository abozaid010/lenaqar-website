import { NextResponse } from "next/server";
import { opportunityCatalogStatus } from "@/lib/lenaqar/opportunities.server";

export const dynamic = "force-dynamic";

/**
 * Readiness for the blue/green deploy: 200 once this container holds a
 * complete opportunity catalogue, 503 while it is still loading. The deploy
 * switches nginx only after a 200, so no visitor waits on the catalogue walk.
 */
export function GET() {
  const status = opportunityCatalogStatus();
  return NextResponse.json(status, {
    status: status.ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
