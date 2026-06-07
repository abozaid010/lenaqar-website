"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  isMessagingConfigReady,
  logWhatsappMessaging,
  normalizeLinkedAutomatedWhatsappList,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";
import { getProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const LOG_PREFIX = "[useMessagingProviderConfig]";

function summarizeAccounts(accounts) {
  return accounts.map((account) => ({
    platform: account.platform,
    whatsapp_number: account.whatsapp_number || null,
    sender_phone_number: resolveSenderPhoneNumber(account) || null,
    ready: isMessagingConfigReady(account),
  }));
}

/**
 * Loads linked_automated_whatsapp accounts for the active (or given) client from profile.
 * Cached per clientId — reuse across SendNewMessageForm, bulk dialog, campaign chat.
 */
export function useMessagingProviderConfig(clientId) {
  const resolvedClientId = clientId || LenaCookiesManager.getClientId();

  const query = useQuery({
    queryKey: ["messagingProviderConfig", resolvedClientId || "unknown"],
    queryFn: async () => {
      logWhatsappMessaging("profile_messaging_loading", {
        clientId: resolvedClientId,
      });

      const response = await getProfileData();
      if (response?.error) {
        logWhatsappMessaging("profile_messaging_failed", {
          clientId: resolvedClientId,
          error: response.error,
        });
        throw new Error(response.error);
      }

      const linked = response?.data?.linked_automated_whatsapp ?? null;
      const allAccounts = normalizeLinkedAutomatedWhatsappList(linked);
      const readyAccounts = allAccounts.filter(isMessagingConfigReady);
      const defaultAccount = readyAccounts[0] ?? allAccounts[0] ?? null;
      const defaultSenderPhone = resolveSenderPhoneNumber(defaultAccount);

      const result = {
        /** All linked platforms (profile may omit secrets — still show in picker). */
        accounts: allAccounts,
        readyAccounts,
        defaultAccount,
        hasMultipleAccounts: allAccounts.length > 1,
        hasLinkedAccounts: allAccounts.length > 0,
        canSendWhatsapp: Boolean(defaultAccount && defaultSenderPhone),
        defaultSenderPhone,
      };

      logWhatsappMessaging("profile_messaging_loaded", {
        clientId: resolvedClientId,
        accountCount: allAccounts.length,
        readyCount: readyAccounts.length,
        hasMultipleAccounts: result.hasMultipleAccounts,
        canSendWhatsapp: result.canSendWhatsapp,
        defaultPlatform: defaultAccount?.platform ?? null,
        defaultSenderPhone: defaultSenderPhone || null,
        accounts: summarizeAccounts(allAccounts),
      });

      return result;
    },
    enabled: Boolean(resolvedClientId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  useEffect(() => {
    if (query.isLoading) return;

    if (query.isError) {
      logWhatsappMessaging("profile_messaging_query_error", {
        clientId: resolvedClientId,
        message: query.error?.message ?? String(query.error),
      });
      return;
    }

    if (query.isSuccess && query.data) {
      logWhatsappMessaging("profile_messaging_query_ready", {
        clientId: resolvedClientId,
        canSendWhatsapp: query.data.canSendWhatsapp,
        defaultSenderPhone: query.data.defaultSenderPhone || null,
        fromCache: !query.isFetching,
      });
    }
  }, [
    query.isLoading,
    query.isError,
    query.isSuccess,
    query.isFetching,
    query.data,
    query.error,
    resolvedClientId,
  ]);

  return query;
}
