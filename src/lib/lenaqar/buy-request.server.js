import { cookies } from "next/headers";
import axiosInstance from "@/utils/axiosInstance";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { SITE } from "@/config/site";
import { cleanRequirementsPayload } from "@/utils/cleanRequirements";
import { NEW_LEAD_ACTION } from "@/utils/action-normalize";
import {
  getLenaqarTenantSession,
  tenantAuthConfig,
} from "./tenant-session.server";

function apiMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.error_message ||
    error?.response?.data?.message ||
    fallback
  );
}

function toPublicError(error, fallbackCode) {
  const status = error?.response?.status;
  const next = new Error(fallbackCode);
  next.code =
    error?.code === "tenant_credentials_missing" ||
    error?.code === "tenant_login_failed"
      ? error.code
      : status === 429
        ? "rate_limited"
        : fallbackCode;
  return next;
}

function inventoryClientId(sessionClientId) {
  return String(SITE.clientId || sessionClientId || "homey").trim();
}

function buyRequestAuthConfig(accessToken, clientId) {
  return {
    headers: {
      ...tenantAuthConfig(accessToken).headers,
      "x-client-id": clientId,
    },
  };
}

async function getBuyRequestAuth() {
  try {
    const session = await getLenaqarTenantSession();
    return {
      accessToken: session.accessToken,
      clientId: inventoryClientId(session.clientId),
    };
  } catch (error) {
    if (
      error?.code !== "tenant_credentials_missing" &&
      error?.code !== "tenant_login_failed"
    ) {
      throw error;
    }
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  if (accessToken) {
    return { accessToken, clientId: inventoryClientId() };
  }

  const next = new Error("tenant_credentials_missing");
  next.code = "tenant_credentials_missing";
  throw next;
}

export async function loadBuyRequestRequirement(userId) {
  if (!userId) return null;
  try {
    const { accessToken, clientId } = await getBuyRequestAuth();
    const response = await axiosInstance.get(
      `requirements/${userId}`,
      buyRequestAuthConfig(accessToken, clientId),
    );
    const data = response.data?.data;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) return null;
    console.error("[lenaqar] load buy request failed", status || error?.message);
    throw toPublicError(error, "load_failed");
  }
}

async function createBuyRequestLead({ name, phone, clientId, accessToken }) {
  const payload = {
    user_id: crypto.randomUUID(),
    phone_number: phone,
    user_name: name,
    query: "Buy request from lenaqar.com",
    client_id: clientId,
    platform: "website",
    campaign_id: "lenaqar_buy_request",
    last_action: NEW_LEAD_ACTION,
    owner_type: "buyer",
  };

  try {
    const response = await axiosInstance.post(
      "/api/leads/addnew",
      payload,
      buyRequestAuthConfig(accessToken, clientId),
    );
    const body = response?.data;
    if (body?.status === false) {
      throw new Error(body?.error_message || body?.message || "create_failed");
    }
    const data = body?.data || {};
    return String(data.user_id || payload.user_id);
  } catch (error) {
    console.error(
      "[lenaqar] create buy-request lead failed",
      error?.response?.status || apiMessage(error, error?.message),
    );
    throw toPublicError(error, "save_failed");
  }
}

async function upsertBuyRequestRequirement({
  userId,
  clientId,
  accessToken,
  payload,
}) {
  const body = cleanRequirementsPayload({
    ...payload,
    client_id: clientId,
    user_id: userId,
  });

  try {
    await axiosInstance.patch(
      `requirements/${userId}`,
      body,
      buyRequestAuthConfig(accessToken, clientId),
    );
  } catch (error) {
    console.error(
      "[lenaqar] save buy request requirement failed",
      error?.response?.status || apiMessage(error, error?.message),
    );
    throw toPublicError(error, "save_failed");
  }
}

/**
 * Persist a public buy request: create the lead (when new), then upsert
 * the requirement on that lead.
 */
export async function saveBuyRequestRequirement({ userId, contact, payload }) {
  const { accessToken, clientId } = await getBuyRequestAuth();

  let id = typeof userId === "string" ? userId.trim() : "";
  if (!id) {
    const name = String(contact?.name || "").trim();
    const phone = String(contact?.phone || "").trim();
    if (!name || !phone) {
      const error = new Error("contact_required");
      error.code = "contact_required";
      throw error;
    }
    id = await createBuyRequestLead({
      name,
      phone,
      clientId,
      accessToken,
    });
  }

  await upsertBuyRequestRequirement({
    userId: id,
    clientId,
    accessToken,
    payload,
  });

  return { userId: id };
}
