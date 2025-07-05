"use client";

import { axiosInstance } from "@/lib/axiosInstance";

export async function fetchUsersData(searchParams) {
  const clientId = "amr";

  try {
    // const params = {
    //   ...JSON.parse(searchParams),
    //   limit: 20,
    // };

    // console.log("Fetching users with params:", params);

    console.log("Fetching users for client:", clientId);
    const response = await axiosInstance.get(`dashboard/amr`);

    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}
