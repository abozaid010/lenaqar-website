"use server";

import { getClientid } from "@/components/services/clientCookies";
import axiosInstance from "@/utils/axiosInstance";
import { revalidatePath } from "next/cache";

export async function addNewAction(prevState, formData) {
  const clientId = await getClientid();

  try {
    const payload = {
      action: formData.get("action"),
      comment: formData.get("comment"),
      created_at: new Date().toISOString(),
      client_id: clientId,

      user_id: formData.get("user_id"),
      phone_number: "",
      meeting_time: formData.get("meeting_time") || null,
    };

    await axiosInstance.post("action/create", payload);

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Action posted successfully",
    };
  } catch (error) {
    // Handle specific error scenarios
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error("Server response error:", error.response.data);
      return {
        success: false,
        message: `Failed to post action: ${error.response.data.detail || "Server error"}`,
      };
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
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
