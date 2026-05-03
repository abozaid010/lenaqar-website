"use client";

import axios from "axios";
import { LenaCookiesManager } from "./LenaCookiesManager";
import { getClientIdFromToken } from "./getRoleFromToken.client";
import { TokenRefreshService } from "./TokenRefreshService";
import { API_BASE_URL } from "./apiConfig";
import { isPermissionsUpdatedError } from "@/constants/permissionsAuth";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  console.log(`🚀 Axios Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

  // Add Authorization header from access token
  if (!config.headers.Authorization) {
    const token = LenaCookiesManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Add x-client-id header from JWT token (not cookie) for backend validation
  if (!config.headers['x-client-id']) {
    const clientIdFromToken = getClientIdFromToken();
    if (clientIdFromToken) {
      config.headers['x-client-id'] = clientIdFromToken;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`📥 Axios Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}`);
    console.log(`📥 Response URL: ${response.request?.responseURL || 'N/A'}`);
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
        await TokenRefreshService.handleRefreshFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
