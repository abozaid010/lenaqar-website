"use client";

import { CAMPAIGN_CHAT_CLIENT_ID } from "@/constants/campaign-chat";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { useWhatsappSelectedAccount } from "@/hooks/useWhatsappSelectedAccount";
import {
  getWhatsappSendContextErrorMessage,
  sendWhatsappOutboundMessage,
  WHATSAPP_ACCOUNT_MISMATCH_CODE,
  WHATSAPP_ACCOUNT_NOT_LINKED_CODE,
  WHATSAPP_NOT_CONFIGURED_CODE,
  WHATSAPP_RATE_LIMIT_EXCEEDED_CODE,
  WHATSAPP_SENDER_PHONE_REQUIRED_CODE,
  WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE,
} from "@/lib/whatsapp-send-outbound";
import {
  openSingleWhatsappDeepLink,
  reportWhatsappDeepLinkResult,
  resolveWhatsappApiSendAccount,
  shouldUseWhatsappDeepLink,
} from "@/lib/whatsapp-deeplink-send";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { sendClientMessage } from "@/utils/api";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

export type WhatsappSendResult = {
  method: "api" | "deeplink" | "client_message";
  message?: string;
};

export interface UseSendWhatsappMessageOptions {
  clientId?: string | null;
  phoneNumber?: string | null;
  chatId?: string | null;
  userName?: string | null;
  userId?: string | null;
  /** Skip API and always open wa.me (for external contacts e.g. property owners). */
  preferDeepLink?: boolean;
  fallbackToDeepLink?: boolean;
}

/**
 * Shared hook for outbound WhatsApp messaging (API + WhatsApp Web deep link).
 * Used by dashboard chat composer and reusable SendMessageToOwner.
 */
export function useSendWhatsappMessage({
  clientId,
  phoneNumber,
  chatId,
  userName,
  userId,
  preferDeepLink = false,
  fallbackToDeepLink = true,
}: UseSendWhatsappMessageOptions = {}) {
  const [pending, setPending] = useState(false);
  const [platformError, setPlatformError] = useState("");
  const { translate, common } = useI18n();

  const resolvedClientId =
    clientId || LenaCookiesManager.getClientId() || CAMPAIGN_CHAT_CLIENT_ID;

  const {
    data: messagingData,
    isLoading: isMessagingLoading,
    isFetching: isMessagingFetching,
    isError: isMessagingError,
    refetch: refetchMessagingConfig,
  } = useMessagingProviderConfig(resolvedClientId);

  const {
    selectedPlatform,
    setSelectedPlatform,
    isAccountSelectionLocked,
    isWhatsappSendBlocked,
    whatsappRestrictionCode,
  } = useWhatsappSelectedAccount(messagingData, resolvedClientId);

  const accounts = messagingData?.accounts ?? [];
  const resolvedChatId = chatId ? String(chatId).trim() : "";
  const rawPhone = phoneNumber ? String(phoneNumber).trim() : "";
  const resolvedPhone = rawPhone
    ? phoneToE164(rawPhone, "EG") || rawPhone
    : "";
  const whatsappRecipient = resolveWhatsappRecipientFields({
    chat_id: resolvedChatId,
    phone_number: resolvedPhone,
  });

  const apiAccount = preferDeepLink
    ? null
    : resolveWhatsappApiSendAccount(messagingData, selectedPlatform);
  const useDeepLink =
    preferDeepLink ||
    shouldUseWhatsappDeepLink(messagingData, selectedPlatform);
  const usesWhatsappApi = Boolean(whatsappRecipient) && Boolean(apiAccount);

  const messagingReady =
    preferDeepLink ||
    useDeepLink ||
    !usesWhatsappApi ||
    (!isMessagingLoading && !isMessagingFetching);
  const canSendWhatsapp =
    !isWhatsappSendBlocked &&
    (preferDeepLink ||
      useDeepLink ||
      !usesWhatsappApi ||
      Boolean(apiAccount) ||
      (fallbackToDeepLink && Boolean(resolvedPhone)));

  const sendDeepLink = useCallback(
    (text: string): WhatsappSendResult | null => {
      if (!resolvedPhone) {
        toast.error(
          translate(
            "whatsappSend.deeplinkNoRecipients",
            "No valid phone numbers to open in WhatsApp.",
          ),
        );
        return null;
      }

      const result = openSingleWhatsappDeepLink(resolvedPhone, text);
      reportWhatsappDeepLinkResult(
        {
          opened: result.ok ? 1 : 0,
          blocked: result.blocked ? 1 : 0,
          total: 1,
          blockedUrls: result.blocked && result.url ? [result.url] : [],
        },
        translate,
        { toastSuccess: toast.success, toastError: toast.error },
      );

      if (!result.ok && result.blocked) {
        return { method: "deeplink", message: result.url };
      }

      const readyMsg = translate(
        "sendMessageToOwner.messageReady",
        "Message ready to send.",
      );
      return { method: "deeplink", message: readyMsg };
    },
    [resolvedPhone, translate],
  );

  const sendMessage = useCallback(
    async (rawText: string): Promise<WhatsappSendResult | null> => {
      const text = String(rawText ?? "").trim();
      if (!text) return null;

      if (isWhatsappSendBlocked) {
        toast.error(
          getWhatsappSendContextErrorMessage(
            whatsappRestrictionCode,
            translate,
          ),
        );
        return null;
      }

      setPlatformError("");
      setPending(true);

      try {
        if (preferDeepLink || useDeepLink) {
          return sendDeepLink(text);
        }

        if (usesWhatsappApi && apiAccount) {
          const result = await sendWhatsappOutboundMessage({
            text,
            whatsappRecipient,
            phoneNumber: resolvedPhone,
            userName,
            clientId: resolvedClientId,
            selectedPlatform,
            messagingData,
            isMessagingLoading,
            isMessagingFetching,
            isMessagingError,
            refetchMessagingConfig,
            translate,
            onPlatformError: setPlatformError,
            fallbackToDeepLink: false,
            forceAccount: apiAccount,
          });

          if (result.method === "deeplink" && result.message) {
            toast.success(result.message);
          }

          return result as WhatsappSendResult;
        }

        if (userId && resolvedClientId) {
          await sendClientMessage({
            user_id: userId,
            client_id: resolvedClientId,
            client_message: text,
          } as Parameters<typeof sendClientMessage>[0]);
          return { method: "client_message" };
        }

        if (fallbackToDeepLink && resolvedPhone) {
          return sendDeepLink(text);
        }

        toast.error(
          translate(
            "editClient.whatsapp.notConfigured",
            "WhatsApp messaging is not configured for this client.",
          ),
        );
        return null;
      } catch (error: unknown) {
        console.error(
          "Failed to send WhatsApp message:",
          error instanceof Error ? error.message : String(error),
        );
        const err = error as {
          code?: string;
          status?: number;
          message?: string;
          response?: { status?: number };
        };
        const code = err?.code;
        const httpStatus = err?.response?.status ?? err?.status;

        if (
          fallbackToDeepLink &&
          resolvedPhone &&
          (httpStatus === 422 || httpStatus === 400)
        ) {
          return sendDeepLink(text);
        }

        if (
          code === WHATSAPP_NOT_CONFIGURED_CODE ||
          code === WHATSAPP_SENDER_PHONE_REQUIRED_CODE ||
          code === WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE ||
          code === WHATSAPP_ACCOUNT_NOT_LINKED_CODE ||
          code === WHATSAPP_ACCOUNT_MISMATCH_CODE
        ) {
          if (fallbackToDeepLink && resolvedPhone) {
            return sendDeepLink(text);
          }
          toast.error(getWhatsappSendContextErrorMessage(code, translate));
          return null;
        }
        if (code === WHATSAPP_RATE_LIMIT_EXCEEDED_CODE || err?.status === 429) {
          toast.error(
            err?.message ||
              translate(
                "whatsappSend.rateLimitExceeded",
                "Daily message limit exceeded. Please try again later.",
              ),
          );
          return null;
        }
        toast.error(
          translate("dashboardFilter.bulkWhatsapp.sendFailed") ||
            common.operationFailed,
        );
        return null;
      } finally {
        setPending(false);
      }
    },
    [
      usesWhatsappApi,
      apiAccount,
      whatsappRecipient,
      resolvedPhone,
      userName,
      resolvedClientId,
      selectedPlatform,
      messagingData,
      isMessagingLoading,
      isMessagingFetching,
      isMessagingError,
      refetchMessagingConfig,
      translate,
      userId,
      fallbackToDeepLink,
      preferDeepLink,
      useDeepLink,
      sendDeepLink,
      common.operationFailed,
      isWhatsappSendBlocked,
      whatsappRestrictionCode,
    ],
  );

  return {
    sendMessage,
    pending,
    selectedPlatform,
    setSelectedPlatform,
    platformError,
    setPlatformError,
    messagingData,
    accounts,
    isMessagingLoading,
    isMessagingFetching,
    isMessagingError,
    whatsappRecipient,
    sendContext: apiAccount
      ? {
          ok: true,
          account: apiAccount,
          senderPhoneNumber:
            apiAccount.whatsapp_number ||
            apiAccount.sender_phone_number ||
            "",
        }
      : null,
    usesWhatsappApi,
    useDeepLink,
    messagingReady,
    canSendWhatsapp,
    resolvedClientId,
    isAccountSelectionLocked,
    isWhatsappSendBlocked,
    whatsappRestrictionCode,
  };
}
