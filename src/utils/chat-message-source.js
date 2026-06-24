/** Incoming lead/customer messages (white bubble, left). */
export const INCOMING_CHAT_SOURCES = new Set([
  "user",
  "whatsapp_inbound",
]);

/** Outgoing business human replies (green bubble, right). */
export const OUTGOING_HUMAN_CHAT_SOURCES = new Set(["human"]);

/** Outgoing AI / automation (green bubble, right). */
export const OUTGOING_AI_CHAT_SOURCES = new Set([
  "ai",
  "assistant",
  "whatsapp_lenaai_sales",
  "wa_automation",
  "whatsapp_automation",
]);

function normalizeChatSource(source) {
  if (source == null) return "";
  return String(source).trim().toLowerCase();
}

export function isAiChatSource(source) {
  const normalized = normalizeChatSource(source);
  return OUTGOING_AI_CHAT_SOURCES.has(normalized);
}

export function isOutgoingChatMessage(message) {
  const source = normalizeChatSource(message?.source);
  const role = normalizeChatSource(message?.role);

  if (OUTGOING_HUMAN_CHAT_SOURCES.has(source)) return true;
  if (OUTGOING_AI_CHAT_SOURCES.has(source)) return true;
  if (INCOMING_CHAT_SOURCES.has(source)) return false;

  // Campaign-chat role fallbacks when source is missing.
  if (role === "admin") return true;
  if (role === "assistant") return true;
  if (role === "user") return false;

  return false;
}

export function getChatBubbleVariant(message) {
  return isOutgoingChatMessage(message) ? "outgoing" : "incoming";
}
