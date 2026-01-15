"use client";

import axios from "axios";
import { LenaCookiesManager } from "./LenaCookiesManager";
import { TokenRefreshService } from "./TokenRefreshService";

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";
  return url.startsWith("http") ? url : `https://${url}`;
};

const BASE_URL = getBaseUrl();

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = LenaCookiesManager.getAccessToken();
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
        // Use TokenRefreshService to handle token refresh and cookie sync
        const newAccessToken = await TokenRefreshService.refreshToken();

        if (newAccessToken) {
          // Update the Authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // Retry the original request with the new token
          return axiosInstance(originalRequest);
        } else {
          throw new Error("Token refresh returned no token");
        }
      } catch (refreshError) {
        // Log error only in development
        if (process.env.NODE_ENV === "development") {
          console.error("[axiosInstance] Token refresh failed:", refreshError);
        }
        // TokenRefreshService handles cookie cleanup and redirect
        TokenRefreshService.handleRefreshFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
