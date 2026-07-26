import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getRoleFromToken } from "@/lib/getRoleFromToken";
import { decodeJwtClientId } from "@/lib/jwtCookieUtils";
import {
  LOCATIONS_ADMIN_CLIENT_IDS,
  LOCATIONS_ADMIN_ROLES,
} from "@/lib/market-index/constants";

/**
 * Locations catalog: homey|public + admin|owner only.
 * Any other client/role → notFound (page never loads).
 * Never trust CLIENT_INFO cookie for authorization.
 */
export async function assertLocationsAdminAccess() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const clientId = (
    decodeJwtClientId(accessToken) ||
    cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value ||
    ""
  )
    .trim()
    .toLowerCase();
  const role = ((await getRoleFromToken()) || "").trim().toLowerCase();

  if (!LOCATIONS_ADMIN_CLIENT_IDS.includes(clientId)) {
    notFound();
  }
  if (!LOCATIONS_ADMIN_ROLES.includes(role)) {
    notFound();
  }

  return { clientId, role };
}
