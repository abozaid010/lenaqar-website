"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getAccountsForOutboundSend } from "@/lib/whatsapp-messaging-provider";
import { getProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Loads linked_automated_whatsapp accounts for the active (or given) client from profile.
 */
export function useMessagingProviderConfig(clientId) {
  const resolvedClientId = clientId || LenaCookiesManager.getClientId();

  const query = useQuery({
    queryKey: ["messagingProviderConfig", resolvedClientId || "unknown"],
    queryFn: async () => {
      const response = await getProfileData();
      if (response?.error) {
        throw new Error(response.error);
      }
      const linked = response?.data?.linked_automated_whatsapp ?? null;
      const accounts = getAccountsForOutboundSend(linked);
      return {
        accounts,
        defaultAccount: accounts[0] ?? null,
        hasMultipleAccounts: accounts.length > 1,
      };
    },
    enabled: Boolean(resolvedClientId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return query;
}
