"use server";
import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/apiConfig";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { isPermissionsUpdatedError } from "@/constants/permissionsAuth";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  if (!config.headers.Authorization) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

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

    // Handle 503 errors with retry logic
    if (error.response?.status === 503 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("503 error detected, retrying request...");

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        return axiosInstance(originalRequest);
      } catch (retryError) {
        console.error("Retry failed:", retryError);
        throw retryError;
      }
    }

    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail;
      if (isPermissionsUpdatedError(detail)) {
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("Attempting to refresh token...");

        // Get the refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL.replace(/\/$/, "")}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Token refreshed successfully");

        const newAccessToken = refreshResponse.data.access_token;
        if (newAccessToken) {
          // Update the Authorization header in the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // Token refresh failed, redirect to login or handle accordingly
        // You might want to redirect to login page here
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
