import { notFound, redirect } from "next/navigation";
import { resolvePublicUnitByCodeParam } from "@/lib/units/unit-legacy-redirect";
import {
  buildAdminUnitDetailPath,
  normalizeUnitCodeParam,
} from "@/lib/units/unit-share-links";
import { getListingClientId } from "@/lib/units/unit-view-mode";

/**
 * Legacy public marketing URL — permanently redirects to the canonical shareable path:
 *   /{listingClientId}/units/{code}
 * Keep this route forever so old bookmarks and shared /allProberties links keep working.
 */
export default async function PublicUnitDetailsRedirectPage({ params }) {
  const { code: rawCode } = await params;

  if (!normalizeUnitCodeParam(rawCode)) {
    notFound();
  }

  let rawUnit;
  try {
    rawUnit = await resolvePublicUnitByCodeParam(rawCode);
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    console.error("Failed to resolve unit for redirect:", error?.message ?? error);
    notFound();
  }

  if (!rawUnit) {
    notFound();
  }

  const code = normalizeUnitCodeParam(rawUnit.code) || normalizeUnitCodeParam(rawCode);
  const listingClientId = getListingClientId(rawUnit);

  if (!code) {
    notFound();
  }

  redirect(buildAdminUnitDetailPath(code, listingClientId));
}
