"use client";

import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import { useI18n } from "@/hooks/useI18n";
import { useSendWhatsappMessage } from "@/hooks/useSendWhatsappMessage";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const MAX_LINES = 3;

export default function SendNewMessageForm({
  userId,
  phoneNumber,
  chatId,
  clientId,
  onNewMessage,
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
  });

  const canSend = Boolean(message.trim() && (usesWhatsappApi || userId));
  const canType = Boolean(usesWhatsappApi || userId);

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
    const result = await sendMessage(text);
    if (!result) return;

    setMessage("");
    onNewMessage?.({
      user_message: text,
      timestamp: Date.now(),
      source: "human",
    });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
    }
  };

  return (
    <form
      className="chat-composer min-h-14 py-2.5 px-3 flex flex-col gap-2 shrink-0"
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
          className="chat-input-field w-full resize-none px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-5 overflow-hidden"
          style={{ minHeight: "42px" }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={
            pending || !canSend || !messagingReady || !canSendWhatsapp
          }
          className={`shrink-0 min-w-[80px] text-white px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2
    ${pending || !canSend || !messagingReady || !canSendWhatsapp ? "bg-chat-panel-alt text-chat-text-faint cursor-not-allowed" : "bg-[#25d366] hover:opacity-90 cursor-pointer"}`}
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
