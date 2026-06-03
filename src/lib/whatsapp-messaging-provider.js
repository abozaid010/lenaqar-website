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
 * Resolve provider from stored linked_automated_whatsapp (supports legacy payloads).
 */
export function resolveMessagingProvider(linked) {
  if (!linked || typeof linked !== "object") {
    return DEFAULT_WHATSAPP_MESSAGING_PROVIDER;
  }
  const explicit = linked.provider ?? linked.messaging_provider;
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

  const provider = resolveMessagingProvider(linked);
  const whatsappNumber = normalizeWhatsappPhone(linked.whatsapp_number || "");

  return {
    provider,
    openwa_session_id:
      linked.openwa_session_id?.trim() ||
      (provider === WHATSAPP_MESSAGING_PROVIDERS.OPENWA
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
 * Mirrors linked_automated_whatsapp: provider, openwa_session_id, whatsapp_number.
 */
export function buildUnifiedReplyProviderPayload(linked) {
  const config = normalizeLinkedAutomatedWhatsapp(linked);
  if (!config) return {};

  if (config.provider === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE) {
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
