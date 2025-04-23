"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";

export default function DynamicTitle() {
  useEffect(() => {
    try {
      const clientInfoCookie = Cookies.get("client_info");
      if (clientInfoCookie) {
        const clientInfo = JSON.parse(clientInfoCookie);
        if (clientInfo?.client_name) {
          document.title = `LENAAI | ${clientInfo.client_name}`;
        }
      }
    } catch (error) {
      console.error("Error updating title:", error);
    }
  }, []);

  return null;
} 