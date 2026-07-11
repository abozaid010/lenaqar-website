"use client";

import { CAMPAIGN_CHAT_CLIENT_ID } from "@/constants/campaign-chat";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { useWhatsappSelectedAccount } from "@/hooks/useWhatsappSelectedAccount";
import {
  getWhatsappSendContextErrorMessage,
  sendWhatsappOutboundMessage,
  WHATSAPP_NOT_CONFIGURED_CODE,
  WHATSAPP_RATE_LIMIT_EXCEEDED_CODE,
  WHATSAPP_SENDER_PHONE_REQUIRED_CODE,
} from "@/lib/whatsapp-send-outbound";
import { resolveWhatsappSendContext } from "@/lib/whatsapp-messaging-provider";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { sendClientMessage } from "@/utils/api";
import { copyToClipboard, openWhatsApp } from "@/utils/phone-utils";
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
 * Shared hook for outbound WhatsApp messaging (API + optional deep-link fallback).
 * Used by dashboard chat composer and reusable SendMessageToOwner.
 */
export function useSendWhatsappMessage({
  clientId,
  phoneNumber,
  chatId,
  userName,
  userId,
  preferDeepLink = false,
  fallbackToDeepLink = false,
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

  const { selectedPlatform, setSelectedPlatform } = useWhatsappSelectedAccount(
    messagingData,
    resolvedClientId,
  );

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
  const usesWhatsappApi = Boolean(whatsappRecipient) && !preferDeepLink;
  const sendContext = usesWhatsappApi
    ? resolveWhatsappSendContext(messagingData, selectedPlatform)
    : null;

  const messagingReady =
    preferDeepLink || !usesWhatsappApi || (!isMessagingLoading && !isMessagingFetching);
  const canSendWhatsapp =
    preferDeepLink ||
    !usesWhatsappApi ||
    sendContext?.ok === true ||
    (isMessagingError && messagingReady) ||
    (fallbackToDeepLink && Boolean(resolvedPhone));

  const sendMessage = useCallback(
    async (rawText: string): Promise<WhatsappSendResult | null> => {
      const text = String(rawText ?? "").trim();
      if (!text) return null;

      setPlatformError("");
      setPending(true);

      try {
        if (preferDeepLink && resolvedPhone) {
          const e164 = phoneToE164(resolvedPhone, "EG") || resolvedPhone;
          copyToClipboard(
            text,
            () => {},
            () => {},
          );
          openWhatsApp(e164, { message: text, newTab: true, target: "_blank" });
          const readyMsg = translate(
            "sendMessageToOwner.messageReady",
            "Message ready to send.",
          );
          toast.success(readyMsg);
          return { method: "deeplink", message: readyMsg };
        }

        if (usesWhatsappApi) {
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
            fallbackToDeepLink,
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
          const e164 = phoneToE164(resolvedPhone, "EG") || resolvedPhone;
          copyToClipboard(
            text,
            () => {},
            () => {},
          );
          openWhatsApp(e164, { message: text, newTab: true, target: "_blank" });
          const readyMsg = translate(
            "sendMessageToOwner.messageReady",
            "Message ready to send.",
          );
          toast.success(readyMsg);
          return { method: "deeplink", message: readyMsg };
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
          (fallbackToDeepLink || preferDeepLink) &&
          resolvedPhone &&
          (httpStatus === 422 || httpStatus === 400)
        ) {
          const e164 = phoneToE164(resolvedPhone, "EG") || resolvedPhone;
          copyToClipboard(
            text,
            () => {},
            () => {},
          );
          openWhatsApp(e164, { message: text, newTab: true, target: "_blank" });
          const readyMsg = translate(
            "sendMessageToOwner.messageReady",
            "Message ready to send.",
          );
          toast.success(readyMsg);
          return { method: "deeplink", message: readyMsg };
        }

        if (
          code === WHATSAPP_NOT_CONFIGURED_CODE ||
          code === WHATSAPP_SENDER_PHONE_REQUIRED_CODE
        ) {
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
      common.operationFailed,
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
    sendContext,
    usesWhatsappApi,
    messagingReady,
    canSendWhatsapp,
    resolvedClientId,
  };
}
