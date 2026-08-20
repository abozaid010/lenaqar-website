"use server";
import axios from "axios";
import { cookies } from "next/headers";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "LenaQar-Marketplace/1.0 (+https://www.lenaqar.com; server-side catalog)",
  },
});

const BFF_SECRET = process.env.BFF_SECRET ?? "";

axiosInstance.interceptors.request.use(async (config) => {
  const url = String(config.url ?? "");
  if (PUBLIC_X_API_KEY && url.startsWith("/public/")) {
    config.headers["X-API-Key"] = PUBLIC_X_API_KEY;
  }

  // Shared secret — backend middleware rejects requests without it so the
  // backend is unreachable even if its URL leaks (e.g. in server logs).
  if (BFF_SECRET) {
    config.headers["X-BFF-Secret"] = BFF_SECRET;
  }

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
      console.warn("503 error detected, retrying request");

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        return axiosInstance(originalRequest);
      } catch (retryError) {
        console.error("Retry failed:", retryError?.message);
        throw retryError;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
