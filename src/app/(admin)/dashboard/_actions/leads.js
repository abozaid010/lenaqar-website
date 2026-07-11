"use server";

import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";
import { normalizeApiDetail } from "@/constants/permissionsAuth";
import { revalidatePath } from "next/cache";
import { NEW_LEAD_ACTION } from "@/utils/actions";

const parseBulkImportValidationErrors = (error) => {
  const responseData = error?.response?.data;
  const detail = responseData?.detail;
  const validationErrors = Array.isArray(responseData?.errors)
    ? responseData.errors
    : Array.isArray(detail)
      ? detail
      : [];

  if (validationErrors.length === 0) {
    return {
      message: normalizeApiDetail(detail) || error?.message || "Failed to import leads",
      failed: [],
    };
  }

  const failed = validationErrors.map((item) => {
    const location = Array.isArray(item?.loc) ? item.loc : [];
    const leadIndex = location[2];
    const field = location[3] || "field";
    const input = item?.input;
    const reason =
      item?.ctx?.error ||
      item?.msg ||
      normalizeApiDetail(item) ||
      "Validation error";

    return {
      index: Number.isInteger(leadIndex) ? leadIndex : -1,
      user_id: null,
      field,
      input,
      reason,
    };
  });

  const firstReason = failed[0]?.reason;
  const message =
    firstReason ||
    normalizeApiDetail(detail) ||
    "Failed to import leads due to validation errors";

  return { message, failed };
};

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
      last_action: NEW_LEAD_ACTION,
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
      last_action: NEW_LEAD_ACTION,
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
  let lastValidationMessage = null;

  // The bulk endpoint validates the whole request: one invalid lead makes the
  // backend reject the entire batch with 422. To avoid a few bad rows blocking
  // every valid lead, isolate the offending rows from the 422 response, drop
  // them, and retry with the rest. Track each lead's original index so failures
  // still map back to the correct spreadsheet row.
  let remaining = normalizedPayloads.map((lead, originalIndex) => ({
    lead,
    originalIndex,
  }));
  const maxAttempts = normalizedPayloads.length + 1;

  for (let attempt = 0; attempt < maxAttempts && remaining.length > 0; attempt += 1) {
    try {
      const response = await axiosInstance.post("/api/leads/bulk", {
        leads: remaining.map((entry) => entry.lead),
      });

      const body = response.data?.data || response.data || {};
      const results = Array.isArray(body.results) ? body.results : [];
      successCount += Number(body.succeeded ?? 0);

      const userIdToEntry = new Map(
        remaining.map((entry) => [String(entry.lead.user_id), entry]),
      );

      results.forEach((item) => {
        if (item?.success) return;
        const entry = userIdToEntry.get(String(item?.user_id));
        failed.push({
          index: entry ? entry.originalIndex : -1,
          user_id: item?.user_id || entry?.lead?.user_id || null,
          reason: item?.error || "Failed to add lead",
        });
      });

      if (results.length === 0 && Number(body.failed ?? 0) > 0) {
        // Fallback when the API doesn't return per-row results.
        remaining.forEach((entry) => {
          failed.push({
            index: entry.originalIndex,
            user_id: entry.lead.user_id,
            reason: "Failed to add lead",
          });
        });
      }

      remaining = []; // request accepted (no 422) — nothing left to retry
    } catch (error) {
      const parsedValidation = parseBulkImportValidationErrors(error);
      lastValidationMessage = parsedValidation.message;
      console.error(
        "Server Action Error (addManyLeadsAction):",
        error.response?.data || error.message,
        parsedValidation,
      );

      // Indices in the 422 are relative to the array we just sent (`remaining`).
      const badLocalIndices = new Set(
        parsedValidation.failed
          .map((item) => item.index)
          .filter((i) => Number.isInteger(i) && i >= 0 && i < remaining.length),
      );

      if (badLocalIndices.size === 0) {
        // Couldn't isolate offending rows — fail everything still pending.
        remaining.forEach((entry) => {
          failed.push({
            index: entry.originalIndex,
            user_id: entry.lead.user_id,
            reason: parsedValidation.message,
          });
        });
        remaining = [];
        break;
      }

      const nextRemaining = [];
      remaining.forEach((entry, localIndex) => {
        if (!badLocalIndices.has(localIndex)) {
          nextRemaining.push(entry);
          return;
        }
        const detail = parsedValidation.failed.find(
          (item) => item.index === localIndex,
        );
        failed.push({
          index: entry.originalIndex,
          user_id: entry.lead.user_id,
          reason: detail?.reason || parsedValidation.message,
        });
      });
      remaining = nextRemaining; // retry with the offending rows removed
    }
  }

  if (successCount > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/campaign-chat");
  }

  return {
    success: successCount > 0,
    message:
      successCount > 0
        ? failed.length > 0
          ? "Some leads failed to import"
          : "Leads imported successfully"
        : lastValidationMessage || "Failed to import leads",
    data: {
      total: normalizedPayloads.length,
      successCount,
      failedCount: failed.length,
      failed,
    },
  };
}
