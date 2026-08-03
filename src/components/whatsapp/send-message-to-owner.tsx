"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import WhatsappRestrictionNotice from "@/components/whatsapp/WhatsappRestrictionNotice";
import {
  formatPhoneForDisplay,
  getPhoneValidationError,
  phoneToE164,
} from "@/components/phone/phone-utils";
import { useI18n } from "@/hooks/useI18n";
import { useSendWhatsappMessage } from "@/hooks/useSendWhatsappMessage";
import {
  buildDefaultReceiverMessage,
  ensureUrlInMessage,
  resolveMessageUnitUrl,
} from "@/lib/whatsapp-message-compose";

export interface SendMessageToOwnerProps {
  receiverName?: string | null;
  receiverPhone?: string | null;
  unitUrl?: string | null;
  defaultMessage?: string | null;
  placeholder?: string | null;
  title?: string | null;
  clientId?: string | null;
  onSent?: (payload: { message: string; method: string }) => void;
  className?: string;
}

export default function SendMessageToOwner({
  receiverName,
  receiverPhone,
  unitUrl,
  defaultMessage,
  placeholder,
  title,
  clientId,
  onSent,
  className = "",
}: SendMessageToOwnerProps) {
  const { translate } = useI18n();
  const messageFieldId = useId();
  const resolvedPhone = receiverPhone?.trim() ?? "";
  const resolvedName = receiverName?.trim() ?? "";
  const resolvedUrl = resolveMessageUnitUrl(unitUrl);

  const initialMessage = useMemo(
    () =>
      defaultMessage?.trim() ||
      buildDefaultReceiverMessage(resolvedName, resolvedUrl, translate),
    [defaultMessage, resolvedName, resolvedUrl, translate],
  );

  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const phoneError = getPhoneValidationError(resolvedPhone, {
    defaultCountry: "EG",
    required: true,
  });
  const hasValidPhone = !phoneError;
  const trimmedMessage = message.trim();
  const canSendMessage = hasValidPhone && Boolean(trimmedMessage);

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
    sendContext,
    usesWhatsappApi,
    messagingReady,
    canSendWhatsapp,
    isAccountSelectionLocked,
    isWhatsappSendBlocked,
    whatsappRestrictionCode,
  } = useSendWhatsappMessage({
    clientId,
    phoneNumber: phoneToE164(resolvedPhone, "EG") || resolvedPhone,
    userName: resolvedName || undefined,
    fallbackToDeepLink: true,
  });

  const displayPhone = formatPhoneForDisplay(resolvedPhone, "EG") || resolvedPhone;

  const handleSend = async () => {
    if (
      !canSendMessage ||
      pending ||
      !messagingReady ||
      !canSendWhatsapp ||
      isWhatsappSendBlocked
    ) {
      return;
    }

    const effectiveUnitUrl = resolveMessageUnitUrl(unitUrl);
    const finalMessage = ensureUrlInMessage(message, effectiveUnitUrl);
    if (finalMessage !== message) {
      setMessage(finalMessage);
    }

    const result = await sendMessage(finalMessage);
    if (!result) return;

    if (result.method === "api") {
      toast.success(
        translate(
          "sendMessageToOwner.sentSuccess",
          "Message sent successfully.",
        ),
      );
    }

    onSent?.({ message: finalMessage, method: result.method });
  };

  const isSendDisabled =
    pending ||
    !canSendMessage ||
    !messagingReady ||
    !canSendWhatsapp ||
    isWhatsappSendBlocked;

  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100 ${className}`}
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary shrink-0" aria-hidden />
        <h4 className="text-sm font-semibold text-gray-900">
          {title ??
            translate("sendMessageToOwner.titleGeneric", "Send Message")}
        </h4>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          {translate("sendMessageToOwner.toLabel", "To")}
        </p>
        {resolvedName ? (
          <p className="text-sm font-medium text-gray-900">{resolvedName}</p>
        ) : null}
        <p className="text-sm text-gray-700" dir="ltr">
          {displayPhone || translate("common.noPhone", "No phone number")}
        </p>
        {!hasValidPhone && resolvedPhone ? (
          <p className="text-xs text-red-600">
            {translate("phoneField.invalid", "Invalid phone number")}
          </p>
        ) : null}
      </div>

      {usesWhatsappApi && isMessagingLoading ? (
        <p className="text-xs text-gray-500">
          {translate(
            "whatsappSend.configLoading",
            "Loading WhatsApp accounts…",
          )}
        </p>
      ) : null}

      {usesWhatsappApi && isMessagingError ? (
        <p className="text-xs text-red-600">
          {translate(
            "whatsappSend.configLoadFailed",
            "Could not load WhatsApp accounts.",
          )}
        </p>
      ) : null}

      {isWhatsappSendBlocked ? (
        <WhatsappRestrictionNotice code={whatsappRestrictionCode} />
      ) : null}

      {accounts.length > 0 ? (
        <WhatsappPlatformSelect
          accounts={accounts}
          hasMultipleAccounts={messagingData?.hasMultipleAccounts}
          value={selectedPlatform}
          onChange={(next) => {
            setSelectedPlatform(next ?? "");
            setPlatformError("");
          }}
          error={platformError}
          required={false}
          locked={isAccountSelectionLocked}
          className="px-0"
        />
      ) : null}

      {usesWhatsappApi &&
      messagingData &&
      !isMessagingLoading &&
      sendContext?.ok ? (
        <p className="text-xs text-gray-500" dir="ltr">
          {translate("whatsappSend.sendingFrom", "Sending from")}:{" "}
          {sendContext.senderPhoneNumber}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor={messageFieldId}
          className="block text-xs text-gray-500"
        >
          {translate("sendMessageToOwner.messageLabel", "Message")}
        </label>
        <textarea
          id={messageFieldId}
          name="receiver_message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            placeholder ??
            translate(
              "sendMessageToOwner.placeholder",
              "Type your message…",
            )
          }
          disabled={pending || !hasValidPhone}
          rows={4}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[96px]"
        />
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={isSendDisabled}
        className={`w-full rounded-full py-2.5 px-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isSendDisabled
            ? "bg-chat-panel-alt text-chat-text-faint cursor-not-allowed"
            : "bg-[#25d366] text-white hover:opacity-90 cursor-pointer"
        }`}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          translate("sendMessageToOwner.sendButton", "Send via WhatsApp")
        )}
      </button>
    </div>
  );
}
