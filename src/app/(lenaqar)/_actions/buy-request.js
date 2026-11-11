"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import {
  loadBuyRequestRequirement,
  saveBuyRequestRequirement,
} from "@/lib/lenaqar/buy-request.server";
import {
  buildPublicBuyRequirement,
  formFromBuiltRequirement,
} from "@/lib/lenaqar/buy-request-payload";
import { loadPriceInsight } from "@/lib/lenaqar/price-insight.server";

function clientIpFromHeaders(headerStore) {
  const xff = headerStore.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headerStore.get("x-real-ip") || "unknown";
}

export async function loadPublicBuyRequest(userId) {
  try {
    const data = await loadBuyRequestRequirement(userId);
    return data;
  } catch (error) {
    return { error: error?.code || "load_failed" };
  }
}

export async function savePublicBuyRequest({
  userId,
  contact,
  payload,
  notBrokerConfirmed,
  attribution,
}) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-buy-request:${ip}`, 8, 60 * 60 * 1000);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  if (notBrokerConfirmed !== true) {
    return { ok: false, code: "not_broker_required" };
  }

  try {
    const saved = await saveBuyRequestRequirement({
      userId,
      contact,
      payload,
      attribution,
    });
    return { ok: true, userId: saved.userId };
  } catch (error) {
    return { ok: false, code: error?.code || "save_failed" };
  }
}

/**
 * Average asking prices for the request the buyer just submitted, for the
 * success screen. The payload is re-validated exactly like a submit, so only a
 * real requirement reaches the backend; budget and contact are not forwarded.
 * Any problem returns `null` — the screen then shows no price block.
 */
export async function loadBuyRequestPriceInsight(payload) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-price-insight:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) return null;

  const built = buildPublicBuyRequirement(formFromBuiltRequirement(payload));
  if (!built.ok) return null;

  return loadPriceInsight(built.requirement);
}
