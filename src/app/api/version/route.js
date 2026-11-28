import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Deployed build identity: used by the VPS health check and to verify the live SHA. */
export function GET() {
  return NextResponse.json({
    sha: process.env.GIT_SHA || "unknown",
    builtAt: process.env.BUILT_AT || "unknown",
  });
}
