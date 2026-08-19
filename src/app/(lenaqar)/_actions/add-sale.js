"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import { submitPublicSaleUnit } from "@/lib/lenaqar/add-sale.server";

function clientIpFromHeaders(headerStore) {
  const xff = headerStore.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headerStore.get("x-real-ip") || "unknown";
}

export async function submitPublicSellUnit(formValues) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-add-sale:${ip}`, 8, 60 * 60 * 1000);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  try {
    const saved = await submitPublicSaleUnit(formValues);
    return { ok: true, unitId: saved.unitId };
  } catch (error) {
    return { ok: false, code: error?.code || "save_failed" };
  }
}
