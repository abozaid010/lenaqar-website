"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  isMessagingConfigReady,
  normalizeLinkedAutomatedWhatsappList,
} from "@/lib/whatsapp-messaging-provider";
import { getProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

const LOG_PREFIX = "[useMessagingProviderConfig]";

/**
 * Loads linked_automated_whatsapp accounts for the active (or given) client from profile.
 */
export function useMessagingProviderConfig(clientId) {
  const resolvedClientId = clientId || LenaCookiesManager.getClientId();

  const query = useQuery({
    queryKey: ["messagingProviderConfig", resolvedClientId || "unknown"],
    queryFn: async () => {
      console.log(`${LOG_PREFIX} loading`, { clientId: resolvedClientId });

      try {
        const response = await getProfileData();
        if (response?.error) {
          console.error(`${LOG_PREFIX} profile request failed`, {
            clientId: resolvedClientId,
            error: response.error,
          });
          throw new Error(response.error);
        }

        const linked = response?.data?.linked_automated_whatsapp ?? null;
        const allAccounts = normalizeLinkedAutomatedWhatsappList(linked);
        const readyAccounts = allAccounts.filter(isMessagingConfigReady);
        const defaultAccount = readyAccounts[0] ?? allAccounts[0] ?? null;

        const result = {
          /** All linked platforms (profile may omit secrets — still show in picker). */
          accounts: allAccounts,
          readyAccounts,
          defaultAccount,
          hasMultipleAccounts: allAccounts.length > 1,
        };

        console.log(`${LOG_PREFIX} loaded`, {
          clientId: resolvedClientId,
          accountCount: allAccounts.length,
          readyCount: readyAccounts.length,
          hasMultipleAccounts: result.hasMultipleAccounts,
          defaultPlatform: defaultAccount?.platform ?? null,
          defaultSenderPhone: defaultAccount?.whatsapp_number ?? null,
          accounts: allAccounts.map((account) => ({
            platform: account.platform,
            whatsapp_number: account.whatsapp_number || null,
            ready: isMessagingConfigReady(account),
          })),
        });

        return result;
      } catch (error) {
        console.error(`${LOG_PREFIX} load failed`, {
          clientId: resolvedClientId,
          message: error?.message ?? String(error),
        });
        throw error;
      }
    },
    enabled: Boolean(resolvedClientId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return query;
}
