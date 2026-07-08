"use client";

import axios from "axios";
import { TokenRefreshService } from "./TokenRefreshService";
import { isPermissionsUpdatedError } from "@/constants/permissionsAuth";

// All API calls route through the same-origin BFF at /api/crm/*.
// The BFF server reads the httpOnly access_token cookie directly —
// Authorization headers are never set client-side.
export const axiosInstance = axios.create({
  baseURL: "/api/crm",
  headers: {
    "Content-Type": "application/json",
  },
});

const isDev = process.env.NODE_ENV === "development";

axiosInstance.interceptors.request.use((config) => {
  if (isDev) {
    console.log(`🚀 BFF Request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log(`📥 BFF Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail;
      if (isPermissionsUpdatedError(detail)) {
        await TokenRefreshService.clearSessionAndRedirectToLogin({
          reason: "permissions_updated",
        });
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshed = await TokenRefreshService.refreshToken();

        if (refreshed) {
          return axiosInstance(originalRequest);
        }
        throw new Error("Token refresh failed");
      } catch (refreshError) {
        // Another request may have rotated tokens (single-flight race). Retry once.
        if (!originalRequest._postRefreshRetry) {
          originalRequest._postRefreshRetry = true;
          try {
            return await axiosInstance(originalRequest);
          } catch (retryError) {
            if (retryError?.response?.status !== 401) {
              return Promise.reject(retryError);
            }
          }
        }

        if (isDev) {
          console.error("[axiosInstance] Token refresh failed:", refreshError);
        }
        await TokenRefreshService.handleRefreshFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
