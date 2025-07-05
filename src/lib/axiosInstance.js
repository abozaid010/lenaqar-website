"use client";

import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";

console.log("=== AXIOS INSTANCE DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "NEXT_PUBLIC_API_BASE_URL env var:",
  process.env.NEXT_PUBLIC_API_BASE_URL
);
console.log("Final BASE_URL:", BASE_URL);
console.log("typeof BASE_URL:", typeof BASE_URL);
console.log(
  "All env vars starting with NEXT_PUBLIC:",
  Object.keys(process.env).filter((key) => key.startsWith("NEXT_PUBLIC"))
);

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Debug the created instance
console.log("Created axios instance baseURL:", axiosInstance.defaults.baseURL);
console.log("Full axios defaults:", axiosInstance.defaults);

axiosInstance.interceptors.request.use((config) => {
  console.log(config.baseURL, config.url);
  if (!config.headers.Authorization) {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("Attempting to refresh token...");

        // Call your own API route instead of external API
        const refreshResponse = await fetch("/api/refresh-token", {
          method: "POST",
          credentials: "include", // Include cookies
        });

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await refreshResponse.json();
        const newAccessToken = data.access_token;

        console.log("Token refreshed successfully");
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError.message);

        // Redirect to login on refresh failure
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
