import { cache } from "react";

import { fetchClientProfileFromCookies } from "@/lib/fetchClientProfile.server";

/**
 * One profile GET per React request tree (RSC + layout). Use in admin layout only.
 * @returns {Promise<object|null>}
 */
export const getCachedClientProfile = cache(fetchClientProfileFromCookies);
