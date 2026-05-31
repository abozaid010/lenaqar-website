"use server";

import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";
import { revalidatePath } from "next/cache";

/**
 * Server action to add a new lead.
 * Payload: user_id, user_name, query, client_id, platform, campaign_id, and `phone_number`
 * (combined E.164 international number from PhoneField).
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

/**
 * Server action to add many leads in one bulk request.
 */
export async function addManyLeadsAction(payloads = []) {
  const clientId = await getClientid();

  if (!Array.isArray(payloads) || payloads.length === 0) {
    return {
      success: false,
      message: "No leads provided",
      data: { total: 0, successCount: 0, failedCount: 0, failed: [] },
    };
  }

  const normalizedPayloads = payloads
    .map((payload) => ({
      ...payload,
      client_id: payload?.client_id || clientId || "",
      platform: payload?.platform || "website",
      campaign_id: payload?.campaign_id || "added_manually",
    }))
    .filter((payload) => payload?.phone_number && payload?.user_name && payload?.client_id);

  if (normalizedPayloads.length === 0) {
    return {
      success: false,
      message: "No valid leads to import",
      data: {
        total: payloads.length,
        successCount: 0,
        failedCount: payloads.length,
        failed: payloads.map((_, index) => ({
          index,
          reason: "Missing required fields",
        })),
      },
    };
  }

  const failed = [];
  let successCount = 0;

  try {
    const response = await axiosInstance.post("/api/leads/bulk", {
      leads: normalizedPayloads,
    });

    const body = response.data?.data || response.data || {};
    const results = Array.isArray(body.results) ? body.results : [];
    const succeededCount = Number(body.succeeded ?? 0);
    const failedCount = Number(body.failed ?? 0);

    successCount = succeededCount;

    const userIdToIndex = new Map(
      normalizedPayloads.map((lead, index) => [String(lead.user_id), index]),
    );

    results.forEach((item) => {
      if (item?.success) return;
      const rowIndex = userIdToIndex.get(String(item?.user_id));
      failed.push({
        index: Number.isInteger(rowIndex) ? rowIndex : -1,
        user_id: item?.user_id || null,
        reason: item?.error || "Failed to add lead",
      });
    });

    if (results.length === 0 && failedCount > 0) {
      // Fallback when API does not return per-row results.
      for (let i = 0; i < failedCount; i += 1) {
        failed.push({
          index: -1,
          user_id: null,
          reason: "Failed to add lead",
        });
      }
    }

    if (successCount > 0) {
      revalidatePath("/dashboard");
      revalidatePath("/campaign-chat");
    }

    return {
      success: successCount > 0,
      message:
        failed.length > 0
          ? "Some leads failed to import"
          : "Leads imported successfully",
      data: {
        total: Number(body.total ?? normalizedPayloads.length),
        successCount,
        failedCount: Number(body.failed ?? failed.length),
        failed,
        results,
      },
    };
  } catch (error) {
    console.error(
      "Server Action Error (addManyLeadsAction):",
      error.response?.data || error.message,
    );
    return {
      success: false,
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to import leads",
      data: {
        total: normalizedPayloads.length,
        successCount: 0,
        failedCount: normalizedPayloads.length - successCount,
        failed,
      },
    };
  }
}
