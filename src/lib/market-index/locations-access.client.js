/**
 * Client-side Locations admin sidebar visibility (UX only).
 * Homey or public tenant + admin/owner. Backend enforces mutations.
 */

import {
  getClientIdFromToken,
  getRoleFromToken,
} from "@/lib/getRoleFromToken.client";
import {
  LOCATIONS_ADMIN_CLIENT_IDS,
  LOCATIONS_ADMIN_ROLES,
} from "@/lib/market-index/constants";

export function isLocationsAdminVisible() {
  const clientId = (getClientIdFromToken() || "").trim().toLowerCase();
  if (!LOCATIONS_ADMIN_CLIENT_IDS.includes(clientId)) return false;
  const role = (getRoleFromToken() || "").trim().toLowerCase();
  return LOCATIONS_ADMIN_ROLES.includes(role);
}
