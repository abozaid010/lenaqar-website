import { phoneToE164 } from "@/components/phone/phone-utils";
import { axiosInstance } from "@/lib/axiosInstance";
import { getClientid } from "@/utils/api";

export type LeadByPhoneResult = {
  userId: string;
  phoneNumber: string;
  name: string;
  created: boolean;
};

/**
 * Upsert a lead by phone via POST /api/leads/addnew (client BFF).
 * Skips the heavy messages/v2/all search — backend get_or_create is deterministic
 * and dashboard upsert preserves an existing display name when the incoming name
 * is blank or equals the phone number.
 */
export async function findOrCreateLeadByPhone(
  phoneE164: string,
): Promise<LeadByPhoneResult> {
  const normalized = phoneToE164(phoneE164, "EG") || String(phoneE164).trim();
  if (!normalized) {
    throw new Error("Invalid phone number");
  }

  const clientId = getClientid() || "public";
  const payload = {
    user_id: crypto.randomUUID(),
    phone_number: normalized,
    user_name: normalized,
    query: "",
    client_id: clientId,
    platform: "website",
    campaign_id: "added_manually",
  };

  try {
    const response = await axiosInstance.post("/api/leads/addnew", payload);
    const body = response?.data;
    if (body?.status === false) {
      throw new Error(
        body?.error_message || body?.message || "Failed to create lead",
      );
    }

    const data = body?.data || {};
    const dashboard = data?.dashboard || {};
    const userId = String(data.user_id || payload.user_id);
    const phoneNumber =
      phoneToE164(dashboard.phone_number || data.phone_number, "EG") ||
      normalized;
    const name = String(
      dashboard.name || data.user_name || data.name || phoneNumber,
    ).trim();
    const created =
      !name ||
      name === phoneNumber ||
      name === normalized;

    return {
      userId,
      phoneNumber,
      name: name || phoneNumber,
      created,
    };
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { data?: { detail?: string; message?: string; error_message?: string } };
      message?: string;
    };
    const message =
      axiosError?.response?.data?.detail ||
      axiosError?.response?.data?.error_message ||
      axiosError?.response?.data?.message ||
      axiosError?.message ||
      "Failed to create lead";
    throw new Error(typeof message === "string" ? message : "Failed to create lead");
  }
}
