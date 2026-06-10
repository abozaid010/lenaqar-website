/** WhatsApp outbound messaging providers for unified-reply / automation. */
export const WHATSAPP_MESSAGING_PROVIDERS = {
  OPENWA: "openwa",
  ULTRAMESSAGE: "ultramessage",
  WHATSAPP_CLOUD_API: "whatsapp",
};

export const DEFAULT_WHATSAPP_MESSAGING_PROVIDER =
  WHATSAPP_MESSAGING_PROVIDERS.OPENWA;

/** Message origin for POST /whatsapp/send_messages (affects rate limiting). */
export const WHATSAPP_MESSAGE_SOURCES = {
  HUMAN: "human",
  AI: "ai",
};

export const DEFAULT_WHATSAPP_MESSAGE_SOURCE =
  WHATSAPP_MESSAGE_SOURCES.HUMAN;

export const WHATSAPP_RATE_LIMIT_EXCEEDED_CODE =
  "WHATSAPP_RATE_LIMIT_EXCEEDED";

export function resolveWhatsappMessageSource(source) {
  const normalized = String(
    source || DEFAULT_WHATSAPP_MESSAGE_SOURCE,
  )
    .trim()
    .toLowerCase();
  return normalized === WHATSAPP_MESSAGE_SOURCES.AI
    ? WHATSAPP_MESSAGE_SOURCES.AI
    : WHATSAPP_MESSAGE_SOURCES.HUMAN;
}
