"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import Cookies from "js-cookie";

export async function fetchUsersDataClient(searchParams) {
  const clientId = Cookies.get("lena-website-client_id");

  console.log("=== FETCH USERS DEBUG ===");
  console.log("Client ID from cookie:", clientId);
  console.log("Search params:", searchParams);
  console.log(
    "axiosInstance.defaults.baseURL:",
    axiosInstance.defaults.baseURL
  );
  console.log(
    "Window location:",
    typeof window !== "undefined" ? window.location.href : "Server-side"
  );

  if (!clientId) {
    throw new Error("Client ID not found");
  }

  try {
    const params = {
      ...searchParams,
      limit: 20,
    };

    const requestUrl = `dashboard/${clientId}`;
    console.log("Making request to path:", requestUrl);
    console.log("With params:", params);
    console.log(
      "Full URL will be:",
      `${axiosInstance.defaults.baseURL}/${requestUrl}`
    );

    const response = await axiosInstance.get(requestUrl, {
      params,
    });

    console.log("Request successful, response data:", response.data);
    return response.data;
  } catch (error) {
    console.error("=== REQUEST FAILED ===");
    console.error("Error message:", error.message);
    console.error("Error config baseURL:", error.config?.baseURL);
    console.error("Error config url:", error.config?.url);
    console.error("Full error config:", error.config);
    console.error("Error response:", error.response?.data);
    throw new Error(error.response?.data?.message || error.message);
  }
}
