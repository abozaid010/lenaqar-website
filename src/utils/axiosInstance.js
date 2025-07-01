"use server";
import axios from "axios";
import { cookies } from "next/headers";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  console.log(
    "Request Interceptor: Adding Authorization header if not present",
    config.headers.Authorization
  );
  if (!config.headers.Authorization) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

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

        // Get the refresh token from cookies
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        // Call external API directly to refresh the token
        const refreshResponse = await axios.post(
          `${BASE_URL}/client/refresh-token`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Cookie: `refresh_token=${refreshToken}`,
            },
          }
        );

        console.log("Token refreshed successfully");

        const newAccessToken = refreshResponse.data.access_token;
        console.log("New Access Token:", newAccessToken);
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
