import { legacyUnitResponse } from "@/lib/lenaqar/legacy-unit-route.server";

/** Legacy unit URL → 308 /opportunities/<code>, 404 if gone, 503 if lookup fails. */
export async function GET(_request, { params }) {
  const { slug } = await params;
  return legacyUnitResponse(slug, { allowCode: true });
}
