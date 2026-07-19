/**
 * Client-side Market Index sidebar visibility (UX only).
 * Homey tenant only — any authenticated role. Backend enforces mutations.
 */

import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { MARKET_INDEX_CLIENT_ID } from "@/lib/market-index/constants";

export function isMarketIndexVisible() {
  const clientId = (getClientIdFromToken() || "").trim().toLowerCase();
  return clientId === MARKET_INDEX_CLIENT_ID;
}
