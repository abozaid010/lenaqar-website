import {
  resolveWhatsappSendContext,
  sendWhatsappWithClientConfig,
  WHATSAPP_MESSAGING_NOT_LOADED_CODE,
  WHATSAPP_NOT_CONFIGURED_CODE,
  WHATSAPP_PLATFORM_REQUIRED_CODE,
  WHATSAPP_RATE_LIMIT_EXCEEDED_CODE,
  WHATSAPP_SENDER_PHONE_REQUIRED_CODE,
  WHATSAPP_MESSAGE_SOURCES,
} from "@/lib/whatsapp-messaging-provider";
import {
  assertWhatsappSenderAllowedForUser,
  getWhatsappAccountRestrictionMessage,
  WHATSAPP_ACCOUNT_MISMATCH_CODE,
  WHATSAPP_ACCOUNT_NOT_LINKED_CODE,
  WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE,
} from "@/lib/whatsapp-account-restriction";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { copyToClipboard, openWhatsApp } from "@/utils/phone-utils";

export {
  WHATSAPP_MESSAGING_NOT_LOADED_CODE,
  WHATSAPP_NOT_CONFIGURED_CODE,
  WHATSAPP_PLATFORM_REQUIRED_CODE,
  WHATSAPP_RATE_LIMIT_EXCEEDED_CODE,
  WHATSAPP_SENDER_PHONE_REQUIRED_CODE,
  WHATSAPP_ACCOUNT_MISMATCH_CODE,
  WHATSAPP_ACCOUNT_NOT_LINKED_CODE,
  WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE,
};

/** Map WhatsApp send-context error codes to localized messages. */
export function getWhatsappSendContextErrorMessage(code, translate) {
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
  if (
    code === WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE ||
    code === WHATSAPP_ACCOUNT_NOT_LINKED_CODE ||
    code === WHATSAPP_ACCOUNT_MISMATCH_CODE
  ) {
    return getWhatsappAccountRestrictionMessage(code, translate);
  }
  return translate(
    "editClient.whatsapp.notConfigured",
    "WhatsApp messaging is not configured for this client.",
  );
}

async function resolveSendContextWithRefetch({
  messagingData,
  selectedPlatform,
  isMessagingLoading,
  isMessagingFetching,
  isMessagingError,
  refetchMessagingConfig,
}) {
  if (isMessagingLoading || isMessagingFetching) {
    return {
      ok: false,
      code: WHATSAPP_MESSAGING_NOT_LOADED_CODE,
    };
  }

  if (isMessagingError || !messagingData) {
    const { data: refreshed } = await refetchMessagingConfig();
    return resolveWhatsappSendContext(refreshed, selectedPlatform);
  }

  return resolveWhatsappSendContext(messagingData, selectedPlatform);
}

function openWhatsappDeepLink(phoneNumber, message, translate) {
  const e164 = phoneToE164(phoneNumber, "EG") || phoneNumber;
  copyToClipboard(
    message,
    () => {},
    () => {},
  );
  openWhatsApp(e164, { message, newTab: true, target: "_blank" });
  return {
    method: "deeplink",
    message: translate(
      "sendMessageToOwner.messageReady",
      "Message ready to send.",
    ),
  };
}

function isWhatsappApiValidationError(error) {
  const status = error?.response?.status ?? error?.status;
  return status === 422 || status === 400;
}

/**
 * Unified outbound WhatsApp send: API when configured, optional wa.me deep link fallback.
 *
 * @returns {{ method: 'api' | 'deeplink', message?: string }}
 */
export async function sendWhatsappOutboundMessage({
  text,
  whatsappRecipient,
  phoneNumber,
  userName,
  clientId,
  selectedPlatform,
  messagingData,
  isMessagingLoading,
  isMessagingFetching,
  isMessagingError,
  refetchMessagingConfig,
  translate,
  onPlatformError,
  fallbackToDeepLink = false,
}) {
  if (!whatsappRecipient) {
    throw new Error("Missing WhatsApp recipient");
  }

  const context = await resolveSendContextWithRefetch({
    messagingData,
    selectedPlatform,
    isMessagingLoading,
    isMessagingFetching,
    isMessagingError,
    refetchMessagingConfig,
    clientId,
  });

  if (!context.ok) {
    if (
      fallbackToDeepLink &&
      phoneNumber?.trim() &&
      (context.code === WHATSAPP_NOT_CONFIGURED_CODE ||
        context.code === WHATSAPP_SENDER_PHONE_REQUIRED_CODE)
    ) {
      return openWhatsappDeepLink(phoneNumber, text, translate);
    }

    const err = getWhatsappSendContextErrorMessage(context.code, translate);
    if (context.code === WHATSAPP_PLATFORM_REQUIRED_CODE) {
      onPlatformError?.(err);
    }
    const error = new Error(err);
    error.code = context.code;
    throw error;
  }

  // Action-layer check: restricted roles cannot send from another linked number
  // when the client has multiple WhatsApp accounts.
  const senderGuard = assertWhatsappSenderAllowedForUser({
    account: context.account,
    accounts: messagingData?.accounts,
  });
  if (!senderGuard.ok) {
    const err = getWhatsappSendContextErrorMessage(senderGuard.code, translate);
    onPlatformError?.(err);
    const error = new Error(err);
    error.code = senderGuard.code;
    throw error;
  }

  try {
    await sendWhatsappWithClientConfig({
      config: context.account,
      messages: [
        {
          ...whatsappRecipient,
          message: text,
          user_name: userName?.trim() || undefined,
          platform: context.transportPlatform,
          sender_phone_number: context.senderPhoneNumber,
          source: WHATSAPP_MESSAGE_SOURCES.HUMAN,
        },
      ],
    });
  } catch (error) {
    if (fallbackToDeepLink && phoneNumber?.trim() && isWhatsappApiValidationError(error)) {
      return openWhatsappDeepLink(phoneNumber, text, translate);
    }
    throw error;
  }

  return { method: "api" };
}
