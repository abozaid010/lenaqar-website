"use server";

import axiosInstance from "@/utils/axiosInstance";

export async function sendNewMessage(prevState, formData) {
  const client_message = formData.get("client_message");
  const userId = formData.get("user_id");
  const client_id = formData.get("lena-website-client_id");
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
    console.log(error);
    return {
      success: false,
      message: "Failed to send message",
      timestamp: timeStamp,
    };
  }
}
