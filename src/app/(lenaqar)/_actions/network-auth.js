"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import { signupNetworkClient, loginNetworkClient } from "@/lib/lenaqar/network-auth.server";
import { uploadNetworkLogo } from "@/lib/lenaqar/network-logo.server";

function clientIpFromHeaders(headerStore) {
  const xff = headerStore.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headerStore.get("x-real-ip") || "unknown";
}

export async function submitNetworkSignup(input) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-network-signup:${ip}`, 8, 60 * 60 * 1000);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  try {
    return await signupNetworkClient(input);
  } catch (error) {
    return { ok: false, code: error?.code || "save_failed" };
  }
}

export async function submitNetworkLogin({ email, password }) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-network-login:${ip}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  try {
    return await loginNetworkClient({ email, password });
  } catch {
    return { ok: false, code: "failed" };
  }
}

export async function submitNetworkLogo(formData) {
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const { allowed } = rateLimit(`lenaqar-network-logo:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return { ok: false, code: "rate_limited" };
  }

  const file = formData?.get?.("file");
  try {
    return await uploadNetworkLogo(file);
  } catch {
    return { ok: false, code: "logoFailed" };
  }
}
