import { phoneToE164 } from "@/components/phone/phone-utils";
import {
  DEFAULT_WHATSAPP_MESSAGING_PROVIDER,
  WHATSAPP_MESSAGING_PROVIDERS,
} from "@/constants/whatsapp-messaging";

export function normalizeWhatsappPhone(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

/**
 * Resolve platform from stored linked_automated_whatsapp.
 * Priority: platform (new) → provider (legacy) → messaging_provider (legacy) → infer from fields.
 */
export function resolveMessagingProvider(linked) {
  if (!linked || typeof linked !== "object") {
    return DEFAULT_WHATSAPP_MESSAGING_PROVIDER;
  }
  // Try platform first (new naming), then provider and messaging_provider (legacy)
  const explicit = linked.platform ?? linked.provider ?? linked.messaging_provider;
  if (
    explicit === WHATSAPP_MESSAGING_PROVIDERS.OPENWA ||
    explicit === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE
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

/**
 * Normalized config for UI + API payload building.
 */
export function normalizeLinkedAutomatedWhatsapp(linked) {
  if (!linked || typeof linked !== "object") return null;

  const platform = resolveMessagingProvider(linked);
  const whatsappNumber = normalizeWhatsappPhone(linked.whatsapp_number || "");

  return {
    platform,
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
  };
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
  return provider !== WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE;
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
