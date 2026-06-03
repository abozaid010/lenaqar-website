"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { normalizeLinkedAutomatedWhatsapp } from "@/lib/whatsapp-messaging-provider";
import { getProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Loads linked_automated_whatsapp for the active (or given) client from profile.
 */
export function useMessagingProviderConfig(clientId) {
  const resolvedClientId = clientId || LenaCookiesManager.getClientId();

  return useQuery({
    queryKey: ["messagingProviderConfig", resolvedClientId || "unknown"],
    queryFn: async () => {
      const response = await getProfileData();
      if (response?.error) {
        throw new Error(response.error);
      }
      const linked = response?.data?.linked_automated_whatsapp ?? null;
      return normalizeLinkedAutomatedWhatsapp(linked);
    },
    enabled: Boolean(resolvedClientId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
