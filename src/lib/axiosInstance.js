"use client";

import axios from "axios";
import { TokenRefreshService } from "./TokenRefreshService";
import { isPermissionsUpdatedError } from "@/constants/permissionsAuth";
import { isPublicSiteRoute } from "@/lib/lenaqar/is-public-site-route";

// All API calls route through the same-origin BFF at /api/crm/*.
// The BFF server reads the httpOnly access_token cookie directly —
// Authorization headers are never set client-side.
export const axiosInstance = axios.create({
  baseURL: "/api/crm",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Public LenaQar site visitors never have a session — a 401 there is a
    // normal error, not a reason to run refresh/session machinery or
    // navigate to /login (they were never asked to log in).
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      isPublicSiteRoute(window.location.pathname)
    ) {
      return Promise.reject(error);
    }

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

        // Only clear the session when the server explicitly rejected the refresh
        // token. Network/timeout/backend failures are transient — leave the
        // session intact so the next action can retry (mirrors useTokenRefresh.js).
        if (!refreshError?.transient) {
          await TokenRefreshService.handleRefreshFailure();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
