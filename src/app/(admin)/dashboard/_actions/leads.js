"use server";

import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";
import { revalidatePath } from "next/cache";

/**
 * Server action to add a new lead.
 * Payload: user_id, user_name, query, client_id, platform, campaign_id, and parsed phone fields
 * (phone_country_code, phone_number national digits, phone_e164, phone_country).
 */
export async function addNewLeadAction(payload) {
  const clientId = await getClientid();

  try {
    const finalPayload = {
      ...payload,
      client_id: payload.client_id || clientId || "public",
      platform: payload.platform || "website",
      campaign_id: payload.campaign_id || "added_manually",
    };

    const response = await axiosInstance.post("/api/leads/addnew", finalPayload);

    // Revalidate paths to show the new lead
    revalidatePath("/dashboard");
    revalidatePath("/campaign-chat");

    return {
      success: true,
      data: response.data?.data || finalPayload,
    };
  } catch (error) {
    console.error("Server Action Error (addNewLeadAction):", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to add lead",
    };
  }
}
