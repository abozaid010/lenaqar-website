"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  isMessagingConfigReady,
  normalizeLinkedAutomatedWhatsappList,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";
import { getProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

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
  _options = {},
) {
  const config = buildMessagingProviderConfigFromProfile(profileResponse);
  if (!config) return false;

  const resolvedClientId = clientId || LenaCookiesManager.getClientId();
  queryClient.setQueryData(
    messagingProviderConfigQueryKey(resolvedClientId),
    config,
  );

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
      const response = await getProfileData();
      if (response?.error) {
        throw new Error(response.error);
      }

      const result = buildMessagingProviderConfigFromProfile(response);
      if (!result) {
        throw new Error("Invalid profile response");
      }

      return result;
    },
    enabled: Boolean(resolvedClientId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return query;
}
