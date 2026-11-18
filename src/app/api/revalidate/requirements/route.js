import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { PUBLIC_REQUIREMENTS_TAG } from "@/lib/lenaqar/requirement-public";

export const dynamic = "force-dynamic";

function secretMatches(expected, given) {
  const a = Buffer.from(String(expected || ""));
  const b = Buffer.from(String(given || ""));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Backend takedown hook (privacy correction, withdrawal): expire every cached public
 * requirement fetch now instead of after the 300 s window.
 */
export async function POST(request) {
  if (
    !secretMatches(
      process.env.REQUIREMENTS_REVALIDATE_SECRET,
      request.headers.get("x-revalidate-secret"),
    )
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag(PUBLIC_REQUIREMENTS_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
