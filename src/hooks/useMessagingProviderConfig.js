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

function summarizeAccounts(accounts) {
  return accounts.map((account) => ({
    platform: account.platform,
    whatsapp_number: account.whatsapp_number || null,
    sender_phone_number: resolveSenderPhoneNumber(account) || null,
    ready: isMessagingConfigReady(account),
  }));
}

export function messagingProviderConfigQueryKey(clientId) {
  const resolved = clientId || LenaCookiesManager.getClientId();
  return ["messagingProviderConfig", resolved || "unknown"];
}

/** Build messaging config from a profile API envelope (server RSC or client GET). */
export function buildMessagingProviderConfigFromProfile(profileResponse) {
  if (!profileResponse || profileResponse?.error) return null;

  const linked = profileResponse?.data?.linked_automated_whatsapp ?? null;
  const allAccounts = normalizeLinkedAutomatedWhatsappList(linked);
  const readyAccounts = allAccounts.filter(isMessagingConfigReady);
  const defaultAccount = readyAccounts[0] ?? allAccounts[0] ?? null;
  const defaultSenderPhone = resolveSenderPhoneNumber(defaultAccount);

  return {
    accounts: allAccounts,
    readyAccounts,
    defaultAccount,
    hasMultipleAccounts: allAccounts.length > 1,
    hasLinkedAccounts: allAccounts.length > 0,
    canSendWhatsapp: Boolean(defaultAccount && defaultSenderPhone),
    defaultSenderPhone,
  };
}

/** Seed React Query from profile already loaded at login (server RSC or sidebar). */
export function seedMessagingProviderConfigCache(
  queryClient,
  clientId,
  profileResponse,
  { source = "unknown" } = {},
) {
  const config = buildMessagingProviderConfigFromProfile(profileResponse);
  if (!config) return false;

  const resolvedClientId = clientId || LenaCookiesManager.getClientId();
  queryClient.setQueryData(
    messagingProviderConfigQueryKey(resolvedClientId),
    config,
  );

  logWhatsappMessaging("profile_messaging_seeded", {
    source,
    clientId: resolvedClientId,
    accountCount: config.accounts.length,
    canSendWhatsapp: config.canSendWhatsapp,
    defaultSenderPhone: config.defaultSenderPhone || null,
    accounts: summarizeAccounts(config.accounts),
  });

  return true;
}

/**
 * Loads linked_automated_whatsapp accounts for the active (or given) client from profile.
 * Cached per clientId — reuse across SendNewMessageForm, bulk dialog, campaign chat.
 *
 * Note: profile is often fetched on the server at admin layout startup (not visible in
 * browser Network). Sidebar seeds this query from that data; client GET runs only on cache miss.
 */
export function useMessagingProviderConfig(clientId) {
  const resolvedClientId = clientId || LenaCookiesManager.getClientId();

  const query = useQuery({
    queryKey: messagingProviderConfigQueryKey(resolvedClientId),
    queryFn: async () => {
      logWhatsappMessaging("profile_messaging_loading", {
        clientId: resolvedClientId,
        reason: "client_fetch",
      });

      const response = await getProfileData();
      if (response?.error) {
        logWhatsappMessaging("profile_messaging_failed", {
          clientId: resolvedClientId,
          error: response.error,
        });
        throw new Error(response.error);
      }

      const result = buildMessagingProviderConfigFromProfile(response);
      if (!result) {
        throw new Error("Invalid profile response");
      }

      logWhatsappMessaging("profile_messaging_loaded", {
        clientId: resolvedClientId,
        source: "client_fetch",
        accountCount: result.accounts.length,
        readyCount: result.readyAccounts.length,
        hasMultipleAccounts: result.hasMultipleAccounts,
        canSendWhatsapp: result.canSendWhatsapp,
        defaultPlatform: result.defaultAccount?.platform ?? null,
        defaultSenderPhone: result.defaultSenderPhone || null,
        accounts: summarizeAccounts(result.accounts),
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
        fetchStatus: query.fetchStatus,
      });
    }
  }, [
    query.isLoading,
    query.isError,
    query.isSuccess,
    query.isFetching,
    query.fetchStatus,
    query.data,
    query.error,
    resolvedClientId,
  ]);

  return query;
}
