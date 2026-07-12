"use server";

import { getClientid } from "@/components/services/clientCookies";
import axiosInstance from "@/utils/axiosInstance";
import { revalidatePath } from "next/cache";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

export async function addNewAction(prevState, formData) {
  const clientId = await getClientid();

  try {
    const payload = {
      action: formData.get("action"),
      comment: formData.get("comment"),
      created_at: new Date().toISOString(),
      client_id: clientId,
      author: formData.get("author") || "",

      user_id: formData.get("user_id"),
      name: formData.get("name") || "",
      phone_number: formData.get("phone_number") || "",
      meeting_time: formData.get("meeting_time") || null,
    };

    const response = await axiosInstance.post("action/v1/create", payload);

    revalidatePath("/dashboard");
    revalidatePath("/schedule");

    // Return the persisted action so the client can append it optimistically
    // (no refetch). Fall back to the submitted payload when the API echoes only
    // a status message.
    const created = response?.data?.data ?? response?.data ?? null;
    const action =
      created && typeof created === "object" && created.action
        ? created
        : payload;

    return {
      success: true,
      message: "Action posted successfully",
      submittedAt: Date.now(),
      action,
    };
  } catch (error) {
    // Handle specific error scenarios
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error("Server response error:", error.response?.status, error.message);
      return {
        success: false,
        message: `Failed to post action: ${error.response.data.detail || "Server error"}`,
      };
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received from server");
      return {
        success: false,
        message: "Failed to post action: No response from server",
      };
    } else {
      // Something else caused the error
      console.error("Unexpected error:", error.message);
      return {
        success: false,
        message: `Failed to post action: ${error.message}`,
      };
    }
  }
}

export async function sendNewMessage(prevState, formData) {
  const client_message = formData.get("client_message");
  const userId = formData.get("user_id");
  const client_id = formData.get(COOKIE_KEYS.CLIENT_ID);
  const timeStamp = new Date().valueOf(); // Get current timestamp

  try {
    const payload = {
      client_message,
      user_id: userId,
      client_id: client_id,
      platform: "website",
      source: "human",
    };
    const response = await axiosInstance.post("/chat/client-message", payload);

    return {
      success: true,
      message: response?.data?.data?.message || payload.client_message,
      timestamp: timeStamp,
    };
  } catch (error) {
    console.error("Failed to send message:", error?.message);
    return {
      success: false,
      message: "Failed to send message",
      timestamp: timeStamp,
    };
  }
}
