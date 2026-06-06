import { phoneToE164 } from "@/components/phone/phone-utils";
import { resolveWhatsappAgent } from "@/constants/whatsapp-agents";
import {
  DEFAULT_WHATSAPP_MESSAGING_PROVIDER,
  WHATSAPP_MESSAGING_PROVIDERS,
} from "@/constants/whatsapp-messaging";
import { sendWhatsappMessages } from "@/utils/api";

/** API transport values for POST /whatsapp/send_messages */
export const WHATSAPP_TRANSPORT_PLATFORMS = {
  ULTRAMSG: "ultramsg",
  OPENWA: "openwa",
  WHATSAPP: "whatsapp",
};

export const WHATSAPP_NOT_CONFIGURED_CODE = "WHATSAPP_NOT_CONFIGURED";

export function normalizeWhatsappPhone(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
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
  const whatsappNumber = normalizeWhatsappPhone(linked.whatsapp_number || "");

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

/** Normalize linked_automated_whatsapp whether API returns array or legacy single object. */
export function normalizeLinkedAutomatedWhatsappList(linked) {
  if (linked == null) return [];

  if (Array.isArray(linked)) {
    return linked.map(normalizeLinkedAutomatedWhatsapp).filter(Boolean);
  }

  if (typeof linked === "object") {
    if (isAccountLike(linked)) {
      const one = normalizeLinkedAutomatedWhatsapp(linked);
      return one ? [one] : [];
    }

    const values = Object.values(linked);
    if (values.some(isAccountLike)) {
      return values.map(normalizeLinkedAutomatedWhatsapp).filter(Boolean);
    }
  }

  return [];
}

/** Find account by internal or API platform alias. */
export function getAccountByPlatform(accounts, platform) {
  if (!platform || !Array.isArray(accounts)) return null;
  const target = toInternalPlatform(platform) || platform;
  return (
    accounts.find((account) => account.platform === target) ?? null
  );
}

/** Resolve the account to use for outbound send from hook data + optional picker value. */
export function resolveSelectedMessagingAccount(messagingData, selectedPlatform) {
  const accounts = messagingData?.accounts ?? [];
  if (accounts.length === 0) return null;
  if (accounts.length === 1) return accounts[0];
  if (!selectedPlatform) return null;
  return getAccountByPlatform(accounts, selectedPlatform);
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

/** default_platform for POST /whatsapp/send_messages, or null when not ready. */
export function getDefaultTransportPlatform(config) {
  if (!isMessagingConfigReady(config)) return null;
  return toTransportPlatform(config.platform);
}

/**
 * Send via POST /whatsapp/send_messages using the client's linked_automated_whatsapp platform.
 * @throws Error with code WHATSAPP_NOT_CONFIGURED when config is incomplete
 */
export async function sendWhatsappWithClientConfig({ messages, config }) {
  if (!isMessagingConfigReady(config)) {
    const err = new Error(WHATSAPP_NOT_CONFIGURED_CODE);
    err.code = WHATSAPP_NOT_CONFIGURED_CODE;
    throw err;
  }

  const default_platform = getDefaultTransportPlatform(config);
  return sendWhatsappMessages({
    messages,
    default_platform,
  });
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

  const normalized = {
    phone_number: String(message.phone_number || "").trim(),
    message: String(message.message || "").trim(),
  };

  if (!normalized.phone_number || !normalized.message) {
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

  return normalized;
}
