/**
 * Normalizes GET /campaign/session payloads for the campaign-chat UI.
 * Backend field names have varied; the chat panel expects `history[]` with
 * { role, content, timestamp }.
 */

import {
  getDisplayUserMessageText,
  hasDisplayUserMessageText,
  isExactPlaceholderUserMessage,
} from "@/utils/imageUtils";

function pickHistoryArray(raw) {
  if (!raw || typeof raw !== "object") return [];

  const session =
    raw.session && typeof raw.session === "object" && !Array.isArray(raw.session)
      ? raw.session
      : null;

  let source =
    raw.history ??
    raw.messages ??
    raw.message_history ??
    raw.conversation_history ??
    raw.chat_history ??
    session?.history ??
    session?.messages ??
    [];

  if (source && typeof source === "object" && !Array.isArray(source)) {
    source =
      source.items ??
      source.messages ??
      source.records ??
      source.data ??
      [];
  }

  return Array.isArray(source) ? source : [];
}

function normalizeRole(msg) {
  let role =
    msg?.role ??
    msg?.sender ??
    msg?.sender_type ??
    msg?.from ??
    msg?.message_role ??
    null;

  if (typeof role === "string") {
    const r = role.trim().toLowerCase();
    if (["user", "human", "customer", "client", "lead", "incoming"].includes(r)) {
      return "user";
    }
    if (["assistant", "bot", "ai", "lena", "system", "outgoing"].includes(r)) {
      return "assistant";
    }
    if (["admin", "agent", "sales", "operator"].includes(r)) {
      return "admin";
    }
  }

  if (msg?.direction) {
    const d = String(msg.direction).toLowerCase();
    if (d === "inbound" || d === "incoming" || d === "received") return "user";
    if (d === "outbound" || d === "outgoing" || d === "sent") return "assistant";
  }

  if (msg?.is_admin === true) return "admin";
  if (msg?.is_ai === true || msg?.from_ai === true) return "assistant";

  return "user";
}

function pickMediaUrl(msg) {
  if (!msg || typeof msg !== "object") return null;

  const url =
    msg.image_url ??
    msg.media_url ??
    (typeof msg.image === "string" ? msg.image : null) ??
    msg.admin_reply_image_url ??
    null;

  if (url == null) return null;
  const trimmed = String(url).trim();
  return trimmed || null;
}

function resolveMessageImageUrl(msg) {
  if (!msg || typeof msg !== "object") return null;

  if (Object.prototype.hasOwnProperty.call(msg, "image_url")) {
    if (msg.image_url == null || msg.image_url === "") return null;
    const trimmed = String(msg.image_url).trim();
    return trimmed || null;
  }

  return pickMediaUrl(msg);
}

function hasText(value) {
  return value != null && String(value).trim().length > 0;
}

function isTurnBasedHistoryItem(msg) {
  return Boolean(
    hasDisplayUserMessageText(msg?.user_message) ||
    isExactPlaceholderUserMessage(msg?.user_message) ||
    hasText(msg?.bot_message) ||
    hasText(msg?.bot_response)
  );
}

function resolveTurnImageUrl(msg, side) {
  const shared = pickMediaUrl(msg);
  const userImage = msg.user_image_url ?? msg.user_media_url ?? null;
  const botImage =
    msg.bot_image_url ??
    msg.bot_media_url ??
    msg.admin_reply_image_url ??
    null;

  if (side === "user") {
    const explicit = userImage != null ? String(userImage).trim() : "";
    if (explicit) return explicit;
    if (hasDisplayUserMessageText(msg.user_message) && shared) return shared;
    if (!hasText(msg.bot_message) && !hasText(msg.bot_response) && shared) {
      return shared;
    }
    if (isExactPlaceholderUserMessage(msg.user_message) && shared) {
      return shared;
    }
    return null;
  }

  const explicit = botImage != null ? String(botImage).trim() : "";
  if (explicit) return explicit;
  if (
    (hasText(msg.bot_message) || hasText(msg.bot_response)) &&
    shared &&
    !hasDisplayUserMessageText(msg.user_message)
  ) {
    return shared;
  }
  return null;
}

function normalizeCampaignMessage(msg) {
  if (!msg || typeof msg !== "object") return null;

  const role = normalizeRole(msg);

  let content =
    msg.content ??
    msg.text ??
    msg.body ??
    msg.message ??
    msg.user_message ??
    msg.bot_message ??
    msg.bot_response ??
    msg.admin_reply_text ??
    "";

  if (role === "user") {
    content = getDisplayUserMessageText(content);
  } else {
    content = String(content ?? "");
  }

  const timestamp =
    msg.timestamp ??
    msg.created_at ??
    msg.sent_at ??
    msg.date ??
    msg.meeting_time ??
    null;

  const normalized = {
    ...msg,
    role,
    content,
    timestamp,
    image_url: resolveMessageImageUrl(msg),
    template_name: msg.template_name ?? msg.template ?? msg.admin_reply_template_name ?? null,
    language_code: msg.language_code ?? msg.lang ?? msg.admin_reply_language_code ?? null,
    source: msg.source ?? null,
  };

  const hasPayload =
    hasText(normalized.content) ||
    Boolean(normalized.image_url) ||
    Boolean(normalized.template_name);

  return hasPayload ? normalized : null;
}

function expandCampaignHistoryItem(msg) {
  if (!isTurnBasedHistoryItem(msg)) {
    const single = normalizeCampaignMessage(msg);
    return single ? [single] : [];
  }

  const results = [];
  const userText = getDisplayUserMessageText(msg.user_message);
  const botText = String(
    msg.bot_message ?? msg.bot_response ?? msg.admin_reply_text ?? ""
  ).trim();
  const userImage = resolveTurnImageUrl(msg, "user");
  const botImage = resolveTurnImageUrl(msg, "bot");
  const botTemplate = msg.template_name ?? msg.admin_reply_template_name ?? null;

  if (userText || userImage || isExactPlaceholderUserMessage(msg.user_message)) {
    const userMsg = normalizeCampaignMessage({
      ...msg,
      role: "user",
      content: userText,
      image_url: userImage,
      template_name: null,
    });
    if (userMsg) results.push(userMsg);
  }

  if (botText || botImage || botTemplate) {
    const botMsg = normalizeCampaignMessage({
      ...msg,
      role: msg.is_admin === true ? "admin" : "assistant",
      content: botText,
      image_url: botImage,
      template_name: botTemplate,
      language_code: msg.language_code ?? msg.admin_reply_language_code ?? null,
    });
    if (botMsg) results.push(botMsg);
  }

  return results;
}

/**
 * @param {object} raw - `response.data.data` from /campaign/session
 */
export function normalizeCampaignSessionData(raw) {
  if (!raw || typeof raw !== "object") {
    return { history: [] };
  }

  const session =
    raw.session && typeof raw.session === "object" && !Array.isArray(raw.session)
      ? raw.session
      : null;

  const history = pickHistoryArray(raw)
    .flatMap(expandCampaignHistoryItem)
    .filter(Boolean);

  const phone_number =
    raw.phone_number ?? session?.phone_number ?? null;
  const user_name = raw.user_name ?? session?.user_name ?? null;

  return {
    ...session,
    ...raw,
    phone_number,
    user_name,
    ai_reply_enabled: raw.ai_reply_enabled ?? session?.ai_reply_enabled,
    is_favorite: raw.is_favorite ?? session?.is_favorite,
    notes: raw.notes ?? session?.notes,
    total_messages_received:
      raw.total_messages_received ?? session?.total_messages_received,
    source: raw.source ?? session?.source ?? null,
    history,
  };
}

/** Digits-only phone for API query consistency. */
export function normalizeCampaignPhoneParam(phone) {
  if (phone == null) return "";
  return String(phone).replace(/\D/g, "");
}
