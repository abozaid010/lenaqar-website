"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import {
  loadBuyRequestRequirement,
  saveBuyRequestRequirement,
} from "@/lib/lenaqar/buy-request.server";

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

export async function savePublicBuyRequest({ userId, contact, payload }) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-buy-request:${ip}`, 8, 60 * 60 * 1000);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  try {
    const saved = await saveBuyRequestRequirement({ userId, contact, payload });
    return { ok: true, userId: saved.userId };
  } catch (error) {
    return { ok: false, code: error?.code || "save_failed" };
  }
}
