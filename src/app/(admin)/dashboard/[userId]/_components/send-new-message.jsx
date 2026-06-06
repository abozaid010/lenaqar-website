"use client";

import { CAMPAIGN_CHAT_CLIENT_ID } from "@/constants/campaign-chat";
import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import {
  buildUnifiedReplyProviderPayload,
  getEffectiveMessagingAccount,
  getDefaultTransportPlatform,
  resolveSenderPhoneNumber,
  sendWhatsappWithClientConfig,
} from "@/lib/whatsapp-messaging-provider";
import { sendCampaignReply, sendClientMessage } from "@/utils/api";
import { normalizeCampaignPhoneParam } from "@/utils/campaign-chat-session";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const MAX_LINES = 3;

export default function SendNewMessageForm({
  userId,
  phoneNumber,
  clientId,
  onNewMessage,
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [platformError, setPlatformError] = useState("");
  const textareaRef = useRef(null);
  const { t, translate, common } = useI18n();
  const queryClient = useQueryClient();
  const { data: messagingData, isLoading: isMessagingLoading } =
    useMessagingProviderConfig(clientId);

  const accounts = messagingData?.accounts ?? [];

  const resolvedClientId =
    clientId || LenaCookiesManager.getClientId() || CAMPAIGN_CHAT_CLIENT_ID;
  const normalizedPhone = phoneNumber
    ? normalizeCampaignPhoneParam(phoneNumber)
    : null;
  const canSend = Boolean(message.trim() && (normalizedPhone || userId));

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

    if (messagingData?.hasMultipleAccounts && !selectedPlatform) {
      const err = translate(
        "whatsappSend.platformRequired",
        "Please choose which WhatsApp account to send from."
      );
      setPlatformError(err);
      toast.error(err);
      return;
    }

    setPlatformError("");
    setPending(true);
    try {
      const account = getEffectiveMessagingAccount(messagingData, selectedPlatform);
      const transportPlatform = account
        ? getDefaultTransportPlatform(account)
        : null;

      if (normalizedPhone && transportPlatform) {
        const senderPhoneNumber = resolveSenderPhoneNumber(account);
        await sendWhatsappWithClientConfig({
          config: account,
          messages: [
            {
              phone_number: normalizedPhone,
              message: text,
              platform: transportPlatform,
              ...(senderPhoneNumber
                ? { sender_phone_number: senderPhoneNumber }
                : {}),
            },
          ],
        });
      } else if (normalizedPhone) {
        const providerPayload = account
          ? buildUnifiedReplyProviderPayload(account)
          : {};
        await sendCampaignReply({
          client_id: resolvedClientId,
          phone_number: normalizedPhone,
          admin_reply_text: text,
          ...providerPayload,
        });
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
      toast.error(
        translate(
          "dashboardFilter.bulkWhatsapp.sendFailed",
          t?.dashboardFilter?.bulkWhatsapp?.sendFailed,
        ) || common.operationFailed,
      );
    } finally {
      setPending(false);
    }
  };

  const canType = Boolean(normalizedPhone || userId);

  return (
    <form
      className="bg-white min-h-14 py-2 px-2 flex flex-col gap-2 shadow-xl rounded-b-md"
      onSubmit={(e) => e.preventDefault()}
    >
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
      <div className="flex gap-2 items-end justify-center">
        <textarea
          ref={textareaRef}
          name="client_message"
          value={message}
          rows={1}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            canType
              ? translate("typeYourMessage", t?.typeYourMessage)
              : translate("common.noPhone", common?.noPhone)
          }
          disabled={!canType || pending}
          className="w-full resize-none p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm leading-5 overflow-hidden"
          style={{ minHeight: "40px" }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={pending || !canSend || isMessagingLoading}
          className={`shrink-0 w-[80px] text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
    ${pending || !canSend || isMessagingLoading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark cursor-pointer"}`}
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : (
            translate("send", t?.send)
          )}
        </button>
      </div>
    </form>
  );
}
