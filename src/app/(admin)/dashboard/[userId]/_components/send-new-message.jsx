"use client";

import { CAMPAIGN_CHAT_CLIENT_ID } from "@/constants/campaign-chat";
import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import {
  logWhatsappMessaging,
  resolveWhatsappSendContext,
  sendWhatsappWithClientConfig,
  WHATSAPP_MESSAGING_NOT_LOADED_CODE,
  WHATSAPP_NOT_CONFIGURED_CODE,
  WHATSAPP_PLATFORM_REQUIRED_CODE,
  WHATSAPP_SENDER_PHONE_REQUIRED_CODE,
} from "@/lib/whatsapp-messaging-provider";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";
import { sendClientMessage } from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const MAX_LINES = 3;

function getSendContextErrorMessage(code, translate) {
  if (code === WHATSAPP_MESSAGING_NOT_LOADED_CODE) {
    return translate(
      "whatsappSend.configLoading",
      "WhatsApp settings are still loading. Please wait and try again.",
    );
  }
  if (code === WHATSAPP_PLATFORM_REQUIRED_CODE) {
    return translate(
      "whatsappSend.platformRequired",
      "Please choose which WhatsApp account to send from.",
    );
  }
  if (code === WHATSAPP_SENDER_PHONE_REQUIRED_CODE) {
    return translate(
      "whatsappSend.senderPhoneRequired",
      "Sender phone number is missing for the selected WhatsApp account.",
    );
  }
  return translate(
    "editClient.whatsapp.notConfigured",
    "WhatsApp messaging is not configured for this client.",
  );
}

export default function SendNewMessageForm({
  userId,
  phoneNumber,
  chatId,
  clientId,
  onNewMessage,
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [platformError, setPlatformError] = useState("");
  const textareaRef = useRef(null);
  const { translate, common } = useI18n();
  const queryClient = useQueryClient();

  const resolvedClientId =
    clientId || LenaCookiesManager.getClientId() || CAMPAIGN_CHAT_CLIENT_ID;

  const {
    data: messagingData,
    isLoading: isMessagingLoading,
    isFetching: isMessagingFetching,
    isError: isMessagingError,
    refetch: refetchMessagingConfig,
  } = useMessagingProviderConfig(resolvedClientId);

  const accounts = messagingData?.accounts ?? [];
  const resolvedChatId = chatId ? String(chatId).trim() : "";
  const resolvedPhone = phoneNumber ? String(phoneNumber).trim() : "";
  const whatsappRecipient = resolveWhatsappRecipientFields({
    chat_id: resolvedChatId,
    phone_number: resolvedPhone,
  });
  const usesWhatsappApi = Boolean(whatsappRecipient);
  const sendContext = usesWhatsappApi
    ? resolveWhatsappSendContext(messagingData, selectedPlatform)
    : null;

  const canSend = Boolean(message.trim() && (usesWhatsappApi || userId));
  const messagingReady =
    !usesWhatsappApi || (!isMessagingLoading && !isMessagingFetching);
  const canSendWhatsapp =
    !usesWhatsappApi ||
    sendContext?.ok === true ||
    (isMessagingError && messagingReady);

  useEffect(() => {
    logWhatsappMessaging("send_form_messaging_state", {
      clientId: resolvedClientId,
      usesWhatsappApi,
      isLoading: isMessagingLoading,
      isFetching: isMessagingFetching,
      isError: isMessagingError,
      hasData: Boolean(messagingData),
      canSendWhatsapp: messagingData?.canSendWhatsapp ?? null,
      defaultSenderPhone: messagingData?.defaultSenderPhone ?? null,
      selectedPlatform: selectedPlatform || null,
      sendContextOk: sendContext?.ok ?? null,
      sendContextCode: sendContext?.code ?? null,
      senderPhoneNumber: sendContext?.senderPhoneNumber ?? null,
    });
  }, [
    resolvedClientId,
    usesWhatsappApi,
    isMessagingLoading,
    isMessagingFetching,
    isMessagingError,
    messagingData,
    selectedPlatform,
    sendContext?.ok,
    sendContext?.code,
    sendContext?.senderPhoneNumber,
  ]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight =
      parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
    const style = getComputedStyle(textarea);
    const verticalPadding =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const maxHeight = lineHeight * MAX_LINES + verticalPadding;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [message]);

  const handleSend = async () => {
    if (!canSend || pending) return;

    const text = message.trim();

    setPlatformError("");
    setPending(true);

    try {
      if (usesWhatsappApi) {
        if (isMessagingLoading || isMessagingFetching) {
          const err = getSendContextErrorMessage(
            WHATSAPP_MESSAGING_NOT_LOADED_CODE,
            translate,
          );
          toast.error(err);
          return;
        }

        if (isMessagingError || !messagingData) {
          logWhatsappMessaging("send_form_refetch_messaging", {
            clientId: resolvedClientId,
          });
          const { data: refreshed } = await refetchMessagingConfig();
          const refreshedContext = resolveWhatsappSendContext(
            refreshed,
            selectedPlatform,
          );
          if (!refreshedContext.ok) {
            const err = getSendContextErrorMessage(
              refreshedContext.code,
              translate,
            );
            if (refreshedContext.code === WHATSAPP_PLATFORM_REQUIRED_CODE) {
              setPlatformError(err);
            }
            toast.error(err);
            return;
          }

          logWhatsappMessaging("send_form_dispatch", {
            clientId: resolvedClientId,
            platform: refreshedContext.transportPlatform,
            senderPhoneNumber: refreshedContext.senderPhoneNumber,
            recipient: whatsappRecipient,
          });

          await sendWhatsappWithClientConfig({
            config: refreshedContext.account,
            messages: [
              {
                ...whatsappRecipient,
                message: text,
                platform: refreshedContext.transportPlatform,
                sender_phone_number: refreshedContext.senderPhoneNumber,
              },
            ],
          });
        } else {
          const context = resolveWhatsappSendContext(
            messagingData,
            selectedPlatform,
          );

          if (!context.ok) {
            const err = getSendContextErrorMessage(context.code, translate);
            if (context.code === WHATSAPP_PLATFORM_REQUIRED_CODE) {
              setPlatformError(err);
            }
            logWhatsappMessaging("send_form_blocked", {
              clientId: resolvedClientId,
              code: context.code,
              selectedPlatform: selectedPlatform || null,
              defaultSenderPhone: messagingData?.defaultSenderPhone ?? null,
            });
            toast.error(err);
            return;
          }

          logWhatsappMessaging("send_form_dispatch", {
            clientId: resolvedClientId,
            platform: context.transportPlatform,
            senderPhoneNumber: context.senderPhoneNumber,
            recipient: whatsappRecipient,
          });

          await sendWhatsappWithClientConfig({
            config: context.account,
            messages: [
              {
                ...whatsappRecipient,
                message: text,
                platform: context.transportPlatform,
                sender_phone_number: context.senderPhoneNumber,
              },
            ],
          });
        }
      } else if (userId && resolvedClientId) {
        await sendClientMessage({
          user_id: userId,
          client_id: resolvedClientId,
          client_message: text,
        });
      } else {
        toast.error(
          translate(
            "editClient.whatsapp.notConfigured",
            "WhatsApp messaging is not configured for this client.",
          ),
        );
        return;
      }

      setMessage("");
      onNewMessage?.({
        user_message: text,
        timestamp: Date.now(),
        source: "human",
      });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      const code = error?.code;
      if (
        code === WHATSAPP_NOT_CONFIGURED_CODE ||
        code === WHATSAPP_SENDER_PHONE_REQUIRED_CODE
      ) {
        toast.error(getSendContextErrorMessage(code, translate));
        return;
      }
      toast.error(
        translate("dashboardFilter.bulkWhatsapp.sendFailed") ||
          common.operationFailed,
      );
    } finally {
      setPending(false);
    }
  };

  const canType = Boolean(usesWhatsappApi || userId);

  return (
    <form
      className="bg-white min-h-14 py-2 px-2 flex flex-col gap-2 shadow-xl rounded-b-md"
      onSubmit={(e) => e.preventDefault()}
    >
      {usesWhatsappApi && isMessagingLoading ? (
        <p className="text-xs text-gray-500 px-0.5">
          {translate(
            "whatsappSend.configLoading",
            "Loading WhatsApp accounts…",
          )}
        </p>
      ) : null}

      {usesWhatsappApi && isMessagingError ? (
        <p className="text-xs text-red-600 px-0.5">
          {translate(
            "whatsappSend.configLoadFailed",
            "Could not load WhatsApp accounts.",
          )}
        </p>
      ) : null}

      {messagingData?.hasMultipleAccounts ? (
        <WhatsappPlatformSelect
          accounts={accounts}
          hasMultipleAccounts={messagingData.hasMultipleAccounts}
          value={selectedPlatform}
          onChange={(next) => {
            setSelectedPlatform(next ?? "");
            setPlatformError("");
          }}
          error={platformError}
          required
          className="px-0"
        />
      ) : null}

      {usesWhatsappApi &&
      messagingData &&
      !isMessagingLoading &&
      sendContext?.ok ? (
        <p className="text-xs text-gray-500 px-0.5" dir="ltr">
          {translate("whatsappSend.sendingFrom", "Sending from")}:{" "}
          {sendContext.senderPhoneNumber}
        </p>
      ) : null}

      <div className="flex gap-2 items-end justify-center">
        <textarea
          ref={textareaRef}
          name="client_message"
          value={message}
          rows={1}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            canType
              ? translate("typeYourMessage")
              : translate("common.noPhone", common?.noPhone)
          }
          disabled={!canType || pending}
          className="w-full resize-none p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm leading-5 overflow-hidden"
          style={{ minHeight: "40px" }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={
            pending || !canSend || !messagingReady || !canSendWhatsapp
          }
          className={`shrink-0 w-[80px] text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
    ${pending || !canSend || !messagingReady || !canSendWhatsapp ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark cursor-pointer"}`}
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : (
            translate("send")
          )}
        </button>
      </div>
    </form>
  );
}
