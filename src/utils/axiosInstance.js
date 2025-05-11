'use server';

import { getClientid } from "@/components/services/clientCookies";
import axios from "axios";
import { cookies } from "next/headers";

const axiosInstance = axios.create({
  baseURL: "https://api.lenaai.net",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
},
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;


