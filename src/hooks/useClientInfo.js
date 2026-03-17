"use client";

import { useState, useEffect } from "react";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

export function useClientInfo() {
  const [clientInfo, setClientInfo] = useState(null);

  useEffect(() => {
    const info = LenaCookiesManager.getClientInfo();
    setClientInfo(info);
  }, []);

  return clientInfo;
}
