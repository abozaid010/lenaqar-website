"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import Cookies from "js-cookie";

export async function fetchUsersData(searchParams) {
  const clientId = Cookies.get("client_id");

  try {
    const params = {
      ...JSON.parse(searchParams),
      limit: 20,
    };

    console.log("Fetching users with params:", params);

    console.log("Fetching users for client:", clientId);
    const response = await axiosInstance.get(`dashboard/amr`, { params });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}
