import { phoneToE164 } from "@/components/phone/phone-utils";
import { resolveWhatsappAgent } from "@/constants/whatsapp-agents";
import {
  DEFAULT_WHATSAPP_MESSAGING_PROVIDER,
  DEFAULT_WHATSAPP_MESSAGE_SOURCE,
  resolveWhatsappMessageSource,
  WHATSAPP_MESSAGE_SOURCES,
  WHATSAPP_MESSAGING_PROVIDERS,
  WHATSAPP_RATE_LIMIT_EXCEEDED_CODE,
} from "@/constants/whatsapp-messaging";

export { WHATSAPP_MESSAGE_SOURCES, WHATSAPP_RATE_LIMIT_EXCEEDED_CODE };
import { sendWhatsappMessages } from "@/utils/api";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";

/** API transport values for POST /whatsapp/send_messages */
export const WHATSAPP_TRANSPORT_PLATFORMS = {
  ULTRAMSG: "ultramsg",
  OPENWA: "openwa",
  WHATSAPP: "whatsapp",
};

export const WHATSAPP_NOT_CONFIGURED_CODE = "WHATSAPP_NOT_CONFIGURED";
export const WHATSAPP_MESSAGING_NOT_LOADED_CODE = "WHATSAPP_MESSAGING_NOT_LOADED";
export const WHATSAPP_PLATFORM_REQUIRED_CODE = "WHATSAPP_PLATFORM_REQUIRED";
export const WHATSAPP_SENDER_PHONE_REQUIRED_CODE = "WHATSAPP_SENDER_PHONE_REQUIRED";

export const WHATSAPP_MESSAGING_LOG_PREFIX = "[whatsapp-messaging]";

/** Dev-only event breadcrumb (no PII payloads). No-op in production. */
export function logWhatsappMessaging(event, _payload = {}) {
  if (process.env.NODE_ENV !== "development") return;
  console.info(`${WHATSAPP_MESSAGING_LOG_PREFIX} ${event}`, { event });
}

export function normalizeWhatsappPhone(raw) {
  if (raw == null || raw === "") return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

/** Sender phone from a linked account (profile may use whatsapp_number or sender_phone_number). */
export function resolveSenderPhoneNumber(config) {
  if (!config || typeof config !== "object") return "";
  return (
    normalizeWhatsappPhone(config.sender_phone_number) ||
    normalizeWhatsappPhone(config.whatsapp_number) ||
    ""
  );
}

/** Map API platform value (ultramsg) to internal constant (ultramessage). */
export function toInternalPlatform(apiPlatform) {
  if (!apiPlatform) return null;
  const raw = String(apiPlatform).trim().toLowerCase();
  if (
    raw === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE ||
    raw === WHATSAPP_TRANSPORT_PLATFORMS.ULTRAMSG
  ) {
    return WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE;
  }
  if (
    raw === WHATSAPP_MESSAGING_PROVIDERS.OPENWA ||
    raw === WHATSAPP_TRANSPORT_PLATFORMS.OPENWA
  ) {
    return WHATSAPP_MESSAGING_PROVIDERS.OPENWA;
  }
  if (
    raw === WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API ||
    raw === WHATSAPP_TRANSPORT_PLATFORMS.WHATSAPP
  ) {
    return WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API;
  }
  return null;
}

/** Map internal platform to API account body / transport platform value. */
export function toApiAccountPlatform(internalPlatform) {
  return toTransportPlatform(internalPlatform);
}

/**
 * Resolve platform from stored linked_automated_whatsapp.
 * Priority: platform (new) → provider (legacy) → messaging_provider (legacy) → infer from fields.
 */
export function resolveMessagingProvider(linked) {
  if (!linked || typeof linked !== "object" || Array.isArray(linked)) {
    return DEFAULT_WHATSAPP_MESSAGING_PROVIDER;
  }
  // Try platform first (new naming), then provider and messaging_provider (legacy)
  const explicit = linked.platform ?? linked.provider ?? linked.messaging_provider;
  const fromApi = toInternalPlatform(explicit);
  if (fromApi) return fromApi;
  if (
    explicit === WHATSAPP_MESSAGING_PROVIDERS.OPENWA ||
    explicit === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE ||
    explicit === WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API
  ) {
    return explicit;
  }
  if (linked.openwa_session_id) {
    return WHATSAPP_MESSAGING_PROVIDERS.OPENWA;
  }
  if (
    linked.whatsapp_instance_id ||
    linked.whatsapp_instance_token
  ) {
    return WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE;
  }
  return DEFAULT_WHATSAPP_MESSAGING_PROVIDER;
}

function parseQuotaNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Normalized config for UI + API payload building.
 */
export function normalizeLinkedAutomatedWhatsapp(linked) {
  if (!linked || typeof linked !== "object" || Array.isArray(linked)) return null;

  const platform = resolveMessagingProvider(linked);
  const whatsappNumber = normalizeWhatsappPhone(
    linked.sender_phone_number || linked.whatsapp_number || ""
  );

  return {
    platform,
    whatsapp_agent: resolveWhatsappAgent(linked.whatsapp_agent),
    openwa_session_id:
      linked.openwa_session_id?.trim() ||
      (platform === WHATSAPP_MESSAGING_PROVIDERS.OPENWA
        ? linked.whatsapp_instance_id?.trim() || ""
        : ""),
    whatsapp_number: whatsappNumber,
    whatsapp_instance_id: linked.whatsapp_instance_id?.trim() ?? "",
    whatsapp_instance_token:
      typeof linked.whatsapp_instance_token === "string"
        ? linked.whatsapp_instance_token.trim()
        : "",
    hasSavedToken: Boolean(linked.whatsapp_instance_token) || true,
    max_messages_per_day: parseQuotaNumber(linked.max_messages_per_day),
    max_messages_per_month: parseQuotaNumber(linked.max_messages_per_month),
    current_messages_sent_today: parseQuotaNumber(
      linked.current_messages_sent_today
    ),
    current_messages_sent_this_month: parseQuotaNumber(
      linked.current_messages_sent_this_month
    ),
  };
}

function isAccountLike(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Boolean(
    value.platform ||
      value.provider ||
      value.messaging_provider ||
      value.whatsapp_number ||
      value.openwa_session_id ||
      value.whatsapp_instance_id
  );
}

/** Stable key for one linked account (supports multiple accounts per platform). */
export function getWhatsappAccountKey(account) {
  if (!account?.platform) return "";

  const platform = toInternalPlatform(account.platform) || account.platform;

  if (isOpenwaProvider(platform)) {
    const session = account.openwa_session_id?.trim();
    if (session) return `${platform}:session:${session}`;
  }

  if (isUltramessageProvider(platform)) {
    const instance = account.whatsapp_instance_id?.trim();
    if (instance) return `${platform}:instance:${instance}`;
  }

  const phone = normalizeWhatsappPhone(account.whatsapp_number);
  if (phone) return `${platform}:phone:${phone}`;

  return `${platform}:unknown`;
}

/** Build account key from an unsaved form snapshot (add/edit validation). */
export function getWhatsappAccountKeyFromSnapshot(snap) {
  if (!snap?.platform) return "";
  return getWhatsappAccountKey({
    platform: snap.platform,
    openwa_session_id: snap.openwa_session_id,
    whatsapp_instance_id: snap.whatsapp_instance_id,
    whatsapp_number: snap.whatsapp_number,
  });
}

function dedupeAccountsByKey(accounts) {
  if (!Array.isArray(accounts)) return [];
  const byKey = new Map();
  for (const account of accounts) {
    const key = getWhatsappAccountKey(account);
    if (!key || key.endsWith(":unknown")) continue;
    if (!byKey.has(key)) byKey.set(key, account);
  }
  return Array.from(byKey.values());
}

/** Normalize linked_automated_whatsapp whether API returns array or legacy single object. */
export function normalizeLinkedAutomatedWhatsappList(linked) {
  if (linked == null) return [];

  if (Array.isArray(linked)) {
    return dedupeAccountsByKey(
      linked.map(normalizeLinkedAutomatedWhatsapp).filter(Boolean)
    );
  }

  if (typeof linked === "object") {
    if (isAccountLike(linked)) {
      const one = normalizeLinkedAutomatedWhatsapp(linked);
      return one ? [one] : [];
    }

    const values = Object.values(linked);
    if (values.some(isAccountLike)) {
      return dedupeAccountsByKey(
        values.map(normalizeLinkedAutomatedWhatsapp).filter(Boolean)
      );
    }
  }

  return [];
}

/** Find account by stable account key. */
export function getAccountByKey(accounts, accountKey) {
  if (!accountKey || !Array.isArray(accounts)) return null;
  return (
    accounts.find((account) => getWhatsappAccountKey(account) === accountKey) ??
    null
  );
}

/** Find account by internal or API platform alias (first match; legacy). */
export function getAccountByPlatform(accounts, platform) {
  if (!platform || !Array.isArray(accounts)) return null;
  if (String(platform).includes(":")) {
    return getAccountByKey(accounts, platform);
  }
  const target = toInternalPlatform(platform) || platform;
  return accounts.find((account) => account.platform === target) ?? null;
}

/** Human-readable subtitle for account cards and pickers. */
export function formatWhatsappAccountSubtitle(account) {
  if (!account) return "";
  if (isOpenwaProvider(account.platform) && account.openwa_session_id?.trim()) {
    return account.openwa_session_id.trim();
  }
  if (
    isUltramessageProvider(account.platform) &&
    account.whatsapp_instance_id?.trim()
  ) {
    return account.whatsapp_instance_id.trim();
  }
  return account.whatsapp_number?.trim() ?? "";
}

/** Query/body params for DELETE /client/whatsapp-instance. */
export function buildWhatsappAccountDeleteParams(account) {
  if (!account) return {};
  const params = {
    platform: toApiAccountPlatform(account.platform),
  };
  const phone = normalizeWhatsappPhone(account.whatsapp_number);
  if (phone) params.whatsapp_number = phone;
  const session = account.openwa_session_id?.trim();
  if (session) params.openwa_session_id = session;
  const instance = account.whatsapp_instance_id?.trim();
  if (instance) params.whatsapp_instance_id = instance;
  return params;
}

/** Resolve the account to use for outbound send from hook data + optional picker value. */
export function resolveSelectedMessagingAccount(messagingData, selectedAccountKey) {
  const accounts = messagingData?.accounts ?? [];
  if (accounts.length === 0) return null;

  if (!messagingData?.hasMultipleAccounts) {
    return messagingData?.defaultAccount ?? accounts[0];
  }

  if (!selectedAccountKey) return null;
  return getAccountByKey(accounts, selectedAccountKey);
}

/** Best account for send: explicit pick, default, or first linked. */
export function getEffectiveMessagingAccount(messagingData, selectedAccountKey) {
  if (!messagingData) return null;
  return (
    resolveSelectedMessagingAccount(messagingData, selectedAccountKey) ??
    messagingData.defaultAccount ??
    messagingData.accounts?.[0] ??
    null
  );
}

/**
 * Validate hook data + optional picker before POST /whatsapp/send_messages.
 * Ensures platform and sender_phone_number are present for the API payload.
 */
export function resolveWhatsappSendContext(messagingData, selectedAccountKey) {
  if (!messagingData) {
    return {
      ok: false,
      code: WHATSAPP_MESSAGING_NOT_LOADED_CODE,
      account: null,
      transportPlatform: null,
      senderPhoneNumber: "",
    };
  }

  if (messagingData.hasMultipleAccounts && !selectedAccountKey) {
    return {
      ok: false,
      code: WHATSAPP_PLATFORM_REQUIRED_CODE,
      account: null,
      transportPlatform: null,
      senderPhoneNumber: "",
    };
  }

  const account = getEffectiveMessagingAccount(messagingData, selectedAccountKey);
  const transportPlatform = account ? getDefaultTransportPlatform(account) : null;
  const senderPhoneNumber = resolveSenderPhoneNumber(account);

  if (!account || !transportPlatform) {
    return {
      ok: false,
      code: WHATSAPP_NOT_CONFIGURED_CODE,
      account,
      transportPlatform,
      senderPhoneNumber,
    };
  }

  if (!senderPhoneNumber) {
    return {
      ok: false,
      code: WHATSAPP_SENDER_PHONE_REQUIRED_CODE,
      account,
      transportPlatform,
      senderPhoneNumber: "",
    };
  }

  return {
    ok: true,
    code: null,
    account,
    transportPlatform,
    senderPhoneNumber,
  };
}

/** Human-readable platform label key suffix for i18n. */
export function getPlatformLabelKey(platform) {
  if (isOpenwaProvider(platform)) return "editClient.whatsapp.platformOpenwa";
  if (isWhatsappCloudApiProvider(platform)) {
    return "editClient.whatsapp.platformCloudApi";
  }
  if (isUltramessageProvider(platform)) {
    return "editClient.whatsapp.platformUltramessage";
  }
  return "editClient.whatsapp.platformOpenwa";
}

const SAVED_TOKEN_MASK = "••••••••••••••••";

/**
 * Build PUT /client/whatsapp-instance body from form snapshot.
 * @param {object} snap - Form fields including platform, limits, credentials
 * @param {object} options - { isLinked, tokenDirty, includeToken }
 */
export function buildWhatsappInstancePayload(
  snap,
  { isLinked = false, tokenDirty = false } = {}
) {
  if (!snap?.platform) return null;

  const whatsapp_agent = resolveWhatsappAgent(snap.whatsapp_agent);
  const whatsapp_number =
    phoneToE164(snap.whatsapp_number, "EG") || snap.whatsapp_number?.trim() || "";

  const payload = {
    platform: toApiAccountPlatform(snap.platform),
    whatsapp_agent,
    whatsapp_number,
  };

  if (snap.max_messages_per_day != null && snap.max_messages_per_day !== "") {
    const n = parseInt(String(snap.max_messages_per_day), 10);
    if (Number.isFinite(n)) payload.max_messages_per_day = n;
  }
  if (snap.max_messages_per_month != null && snap.max_messages_per_month !== "") {
    const n = parseInt(String(snap.max_messages_per_month), 10);
    if (Number.isFinite(n)) payload.max_messages_per_month = n;
  }

  if (isOpenwaProvider(snap.platform)) {
    payload.openwa_session_id = snap.openwa_session_id?.trim() ?? "";
    return payload;
  }

  if (isWhatsappCloudApiProvider(snap.platform)) {
    return payload;
  }

  payload.whatsapp_instance_id = snap.whatsapp_instance_id?.trim() ?? "";
  const token = snap.whatsapp_instance_token?.trim() ?? "";
  const tokenRequired = !isLinked || tokenDirty;
  if (token && token !== SAVED_TOKEN_MASK) {
    payload.whatsapp_instance_token = token;
  } else if (tokenRequired && token && token !== SAVED_TOKEN_MASK) {
    payload.whatsapp_instance_token = token;
  }

  return payload;
}

/**
 * Extra fields for POST /campaign/unified-reply (and similar send endpoints).
 * Mirrors linked_automated_whatsapp: platform, openwa_session_id, whatsapp_number.
 */
export function buildUnifiedReplyProviderPayload(linked) {
  const config = normalizeLinkedAutomatedWhatsapp(linked);
  if (!config) return {};

  if (config.platform === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE) {
    if (!config.whatsapp_instance_id || !config.whatsapp_number) {
      return {};
    }
    const payload = {
      provider: WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE,
      whatsapp_instance_id: config.whatsapp_instance_id,
      whatsapp_number: config.whatsapp_number,
    };
    if (config.whatsapp_instance_token) {
      payload.whatsapp_instance_token = config.whatsapp_instance_token;
    }
    return payload;
  }

  if (isWhatsappCloudApiProvider(config.platform)) {
    if (!config.whatsapp_number) {
      return {};
    }
    return {
      provider: WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API,
      whatsapp_number: config.whatsapp_number,
    };
  }

  if (!config.openwa_session_id || !config.whatsapp_number) {
    return {};
  }

  return {
    provider: WHATSAPP_MESSAGING_PROVIDERS.OPENWA,
    openwa_session_id: config.openwa_session_id,
    whatsapp_number: config.whatsapp_number,
  };
}

export function isOpenwaProvider(provider) {
  return provider === WHATSAPP_MESSAGING_PROVIDERS.OPENWA;
}

export function isUltramessageProvider(provider) {
  return provider === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE;
}

export function isWhatsappCloudApiProvider(provider) {
  return provider === WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API;
}

/**
 * Map internal linked_automated_whatsapp platform to API transport platform.
 */
export function toTransportPlatform(internalPlatform) {
  if (!internalPlatform) return null;
  const raw = String(internalPlatform).trim().toLowerCase();
  if (
    raw === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE ||
    raw === WHATSAPP_TRANSPORT_PLATFORMS.ULTRAMSG
  ) {
    return WHATSAPP_TRANSPORT_PLATFORMS.ULTRAMSG;
  }
  if (
    raw === WHATSAPP_MESSAGING_PROVIDERS.OPENWA ||
    raw === WHATSAPP_TRANSPORT_PLATFORMS.OPENWA
  ) {
    return WHATSAPP_TRANSPORT_PLATFORMS.OPENWA;
  }
  if (
    raw === WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API ||
    raw === WHATSAPP_TRANSPORT_PLATFORMS.WHATSAPP
  ) {
    return WHATSAPP_TRANSPORT_PLATFORMS.WHATSAPP;
  }
  return null;
}

/** Whether linked config has the fields required for outbound send on the saved platform. */
export function isMessagingConfigReady(config) {
  if (!config) return false;

  if (isUltramessageProvider(config.platform)) {
    return Boolean(
      config.whatsapp_instance_id?.trim() && config.whatsapp_number?.trim()
    );
  }

  if (isWhatsappCloudApiProvider(config.platform)) {
    return Boolean(config.whatsapp_number?.trim());
  }

  if (isOpenwaProvider(config.platform)) {
    return Boolean(
      config.openwa_session_id?.trim() && config.whatsapp_number?.trim()
    );
  }

  return false;
}

/** Normalize linked accounts for outbound send (deduped; prefer send-ready). */
export function getAccountsForOutboundSend(linked) {
  const all = dedupeAccountsByKey(normalizeLinkedAutomatedWhatsappList(linked));
  const ready = all.filter(isMessagingConfigReady);
  return ready.length > 0 ? ready : all;
}

/** default_platform for POST /whatsapp/send_messages, or null when not ready. */
export function getDefaultTransportPlatform(config) {
  if (!config) return null;
  const fromPlatform = config.platform
    ? toTransportPlatform(config.platform)
    : null;
  if (fromPlatform) return fromPlatform;
  if (!isMessagingConfigReady(config)) return null;
  return toTransportPlatform(config.platform);
}

/**
 * Send via POST /whatsapp/send_messages using the client's linked account platform.
 * Backend resolves credentials from JWT client_id + platform; local profile need not
 * include secrets (openwa_session_id, tokens are stripped in API responses).
 * @throws Error with code WHATSAPP_NOT_CONFIGURED when platform cannot be resolved
 */
export async function sendWhatsappWithClientConfig({ messages, config }) {
  const default_platform = getDefaultTransportPlatform(config);
  if (!default_platform) {
    const err = new Error(WHATSAPP_NOT_CONFIGURED_CODE);
    err.code = WHATSAPP_NOT_CONFIGURED_CODE;
    throw err;
  }

  const sender_phone_number = resolveSenderPhoneNumber(config);
  if (!sender_phone_number) {
    logWhatsappMessaging("send_blocked_missing_sender");
    const err = new Error(WHATSAPP_SENDER_PHONE_REQUIRED_CODE);
    err.code = WHATSAPP_SENDER_PHONE_REQUIRED_CODE;
    throw err;
  }

  const enrichedMessages = messages.map((msg) => ({
    ...msg,
    sender_phone_number: msg.sender_phone_number || sender_phone_number,
    source: resolveWhatsappMessageSource(msg.source ?? DEFAULT_WHATSAPP_MESSAGE_SOURCE),
  }));

  logWhatsappMessaging("send_request");

  const result = await sendWhatsappMessages({
    messages: enrichedMessages,
    default_platform,
    sender_phone_number,
  });

  logWhatsappMessaging("send_response");

  return result;
}

/**
 * Build message object for POST /whatsapp/send_messages (website unified endpoint).
 * Uses `platform` field (not `provider`).
 * 
 * @param {Object} message - Message with phone_number, message, user_name, etc.
 * @param {string} defaultPlatform - Default platform if message doesn't specify one
 * @returns {Object} Normalized message object for API
 */
export function buildWhatsappSendMessage(message, defaultPlatform = null) {
  if (!message || typeof message !== "object") return null;

  const recipient = resolveWhatsappRecipientFields(message);
  const normalized = {
    ...recipient,
    message: String(message.message || "").trim(),
  };

  if (!recipient || !normalized.message) {
    return null;
  }

  // Add optional fields
  if (message.user_name) {
    normalized.user_name = String(message.user_name).trim();
  }
  if (message.platform) {
    normalized.platform = String(message.platform).trim().toLowerCase();
  }
  if (message.image_url) {
    normalized.image_url = String(message.image_url).trim();
  }
  if (message.template_name) {
    normalized.template_name = String(message.template_name).trim();
  }
  if (message.language_code) {
    normalized.language_code = String(message.language_code).trim();
  }
  if (message.sender_phone_number) {
    normalized.sender_phone_number = normalizeWhatsappPhone(
      String(message.sender_phone_number)
    );
  }
  normalized.source = resolveWhatsappMessageSource(message.source);

  return normalized;
}
