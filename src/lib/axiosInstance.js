"use client";

import axios from "axios";
import { LenaCookiesManager } from "./LenaCookiesManager";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const BASE_URL = "https://api.lenaai.net"; // Force public URL for client-side requests

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = LenaCookiesManager.getAccessToken(); // Use helper or generic get(COOKIE_KEYS.ACCESS_TOKEN)
    // Helper is cleaner: LenaCookiesManager.getAccessToken()
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
        LenaCookiesManager.remove(COOKIE_KEYS.ACCESS_TOKEN);
        LenaCookiesManager.remove(COOKIE_KEYS.REFRESH_TOKEN);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
