"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import { useEffect, useState } from "react";

export default function AxiosDebugger() {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      baseURL: axiosInstance.defaults.baseURL,
      timeout: axiosInstance.defaults.timeout,
      headers: axiosInstance.defaults.headers,
      env_NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      windowLocation:
        typeof window !== "undefined" ? window.location.href : "N/A",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "N/A",
    };

    // console.log("=== AXIOS DEBUGGER ===", info);
    setDebugInfo(info);
  }, []);

  return <></>;
}
