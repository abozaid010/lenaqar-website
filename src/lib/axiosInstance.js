"use client";

import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
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
        const refreshToken = Cookies.get("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        console.log("Attempting to refresh token...", refreshToken);
        const refreshResponse = await axios.post(
          `${BASE_URL}/client/refresh-token`,
          {
            refresh_token: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Cookie: `refresh_token=${refreshToken}`,
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }
        );

        const newAccessToken = refreshResponse.data.access_token;
        console.log("Token refreshed successfully", refreshResponse);
        Cookies.set("access_token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError.message);
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);
