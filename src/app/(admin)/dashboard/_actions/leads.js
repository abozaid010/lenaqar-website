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
 * Server action to add many leads in controlled batches.
 * Uses the existing add-new endpoint for each lead payload.
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
      client_id: payload?.client_id || clientId || "public",
      platform: payload?.platform || "website",
      campaign_id: payload?.campaign_id || "added_manually",
    }))
    .filter((payload) => payload?.phone_number && payload?.user_name);

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

  const batchSize = 20;
  const failed = [];
  let successCount = 0;

  try {
    for (let i = 0; i < normalizedPayloads.length; i += batchSize) {
      const batch = normalizedPayloads.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((payload) => axiosInstance.post("/api/leads/addnew", payload)),
      );

      results.forEach((result, batchIndex) => {
        if (result.status === "fulfilled") {
          successCount += 1;
          return;
        }
        const reason =
          result.reason?.response?.data?.detail ||
          result.reason?.response?.data?.message ||
          result.reason?.message ||
          "Failed to add lead";
        failed.push({
          index: i + batchIndex,
          reason,
        });
      });
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
        total: normalizedPayloads.length,
        successCount,
        failedCount: failed.length,
        failed,
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
        successCount,
        failedCount: normalizedPayloads.length - successCount,
        failed,
      },
    };
  }
}
