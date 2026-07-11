"use client";

import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import { useI18n } from "@/hooks/useI18n";
import { useSendWhatsappMessage } from "@/hooks/useSendWhatsappMessage";
import { ensureUrlInMessage } from "@/lib/whatsapp-message-compose";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const MAX_LINES = 3;

export default function ChatInput({
  userId,
  phoneNumber,
  chatId,
  clientId,
  outgoingUrl,
  onNewMessage,
  conversationQueryKey,
  compact = false,
}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const { translate, common } = useI18n();
  const queryClient = useQueryClient();

  const resolvedChatId = chatId ? String(chatId).trim() : "";
  const resolvedPhone = phoneNumber ? String(phoneNumber).trim() : "";

  const {
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
    usesWhatsappApi,
    messagingReady,
    canSendWhatsapp,
    sendContext,
  } = useSendWhatsappMessage({
    clientId,
    phoneNumber: resolvedPhone,
    chatId: resolvedChatId,
    userId,
    fallbackToDeepLink: true,
  });

  const canSend = Boolean(message.trim() && (usesWhatsappApi || userId || resolvedPhone));
  const canType = Boolean(usesWhatsappApi || userId || resolvedPhone);

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

  const invalidateQueries = () => {
    if (userId) {
      void queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
    }
    if (conversationQueryKey) {
      void queryClient.invalidateQueries({
        queryKey: conversationQueryKey,
      });
    }
  };

  const handleSend = async () => {
    if (!canSend || pending) return;

    // With multiple linked accounts the user must pick a sender. Block the send
    // (rather than falling through to the wa.me deep-link) until one is chosen —
    // mirrors ChatPanel and keeps sending on the backend API path.
    if (messagingData?.hasMultipleAccounts && !selectedPlatform) {
      const err = translate(
        "whatsappSend.platformRequired",
        "Please choose which WhatsApp account to send from.",
      );
      setPlatformError(err);
      toast.error(err);
      return;
    }

    const baseText = message.trim();
    const text = outgoingUrl
      ? ensureUrlInMessage(baseText, outgoingUrl)
      : baseText;

    const result = await sendMessage(text);
    if (!result) return;

    setMessage("");
    onNewMessage?.({
      user_message: text,
      timestamp: Date.now(),
      source: "human",
    });
    invalidateQueries();
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void handleSend();
  };

  const composerClass = compact
    ? "chat-composer min-h-12 py-2 px-2 flex flex-col gap-1.5 shrink-0 border-t border-gray-100 bg-white"
    : "chat-composer min-h-14 py-2.5 px-3 flex flex-col gap-2 shrink-0";

  return (
    <form
      className={composerClass}
      onSubmit={(event) => event.preventDefault()}
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

      <div
        className={`chat-input-shell relative w-full ${
          !canType || pending ? "opacity-50" : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          name="client_message"
          value={message}
          rows={1}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            canType
              ? translate("typeYourMessage")
              : translate("common.noPhone", common?.noPhone)
          }
          disabled={!canType || pending}
          aria-label={translate("chatConversation.messageInput", "Message")}
          className="w-full resize-none border-0 bg-transparent ps-4 pe-11 py-2.5 disabled:cursor-not-allowed text-sm leading-5 overflow-hidden"
          style={{ minHeight: compact ? "38px" : "42px" }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={
            pending || !canSend || !messagingReady || !canSendWhatsapp
          }
          aria-label={translate("send")}
          title={translate("send")}
          className={`absolute end-1.5 bottom-1.5 shrink-0 h-8 w-8 rounded-full transition-all flex items-center justify-center
    ${pending || !canSend || !messagingReady || !canSendWhatsapp ? "bg-chat-panel-alt text-chat-text-faint cursor-not-allowed" : "bg-[#25d366] text-white hover:opacity-90 cursor-pointer"}`}
        >
          {pending ? (
            <Loader2 className="animate-spin w-4 h-4" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
        </button>
      </div>
    </form>
  );
}
