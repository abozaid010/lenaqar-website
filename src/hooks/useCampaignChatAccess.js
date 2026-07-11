"use client";

import { useState, useEffect } from "react";
import { getRoleFromToken, getClientIdFromToken } from "@/lib/getRoleFromToken.client";

/**
 * Custom hook for managing campaign chat access control
 * Consolidates authorization logic used across multiple components
 */
export function useCampaignChatAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [canAccessCampaignChat, setCanAccessCampaignChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      try {
        setIsLoading(true);
        
        const role = getRoleFromToken();
        const currentClientId = getClientIdFromToken();
        
        const hasAdminAccess = ["admin", "owner"].includes(role?.toLowerCase());
        const isPublicClient = currentClientId === "public";
        const canAccess = hasAdminAccess && isPublicClient;
        
        setIsAdmin(hasAdminAccess);
        setClientId(currentClientId);
        setCanAccessCampaignChat(canAccess);
      } catch (error) {
        console.error("Error checking campaign chat access:", error?.message ?? error);
        setIsAdmin(false);
        setClientId(null);
        setCanAccessCampaignChat(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  return {
    isAdmin,
    clientId,
    canAccessCampaignChat,
    isLoading
  };
}
