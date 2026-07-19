import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getRoleFromToken } from "@/lib/getRoleFromToken";
import { decodeJwtClientId } from "@/lib/jwtCookieUtils";
import {
  MARKET_INDEX_CLIENT_ID,
  MARKET_INDEX_EDIT_ROLES,
} from "@/lib/market-index/constants";

/**
 * Homey tenant may view Market Index. Admin/owner may edit.
 * Non-homey → notFound. Never trust client cookies for canEdit.
 *
 * @returns {Promise<{ canEdit: boolean }>}
 */
export async function assertMarketIndexAccess() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const clientId =
    decodeJwtClientId(accessToken) ||
    cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value ||
    "";
  const role = (await getRoleFromToken()) || "";

  if (clientId.trim().toLowerCase() !== MARKET_INDEX_CLIENT_ID) {
    notFound();
  }

  const normalizedRole = role.trim().toLowerCase();
  const canEdit = MARKET_INDEX_EDIT_ROLES.includes(normalizedRole);
  return { canEdit };
}
