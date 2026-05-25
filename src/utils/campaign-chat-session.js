/**
 * Normalizes GET /campaign/session payloads for the campaign-chat UI.
 * Backend field names have varied; the chat panel expects `history[]` with
 * { role, content, timestamp }.
 */

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

function normalizeCampaignMessage(msg) {
  if (!msg || typeof msg !== "object") return null;

  const content =
    msg.content ??
    msg.text ??
    msg.body ??
    msg.message ??
    msg.admin_reply_text ??
    "";

  const timestamp =
    msg.timestamp ??
    msg.created_at ??
    msg.sent_at ??
    msg.date ??
    msg.meeting_time ??
    null;

  return {
    ...msg,
    role: normalizeRole(msg),
    content: String(content ?? ""),
    timestamp,
    image_url: msg.image_url ?? msg.media_url ?? msg.image ?? null,
    template_name: msg.template_name ?? msg.template ?? null,
    language_code: msg.language_code ?? msg.lang ?? null,
    source: msg.source ?? null,
  };
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
    .map(normalizeCampaignMessage)
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
