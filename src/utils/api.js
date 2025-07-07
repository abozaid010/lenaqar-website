"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import Cookies from "js-cookie";

export async function fetchUsersData(searchParams) {
  const clientId = Cookies.get("lena-website-client_id");

  try {
    const params = {
      ...JSON.parse(searchParams),
      limit: 20,
    };

    const response = await axiosInstance.get(`dashboard/${clientId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function getClientActions(phoneNumber) {
  try {
    const response = await axiosInstance.get(`action/${phoneNumber}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}

export async function getClientRequirements(user_id) {
  try {
    const response = await axiosInstance.get(`requirements/${user_id}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}
