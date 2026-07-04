/**
 * Helpers for composing outbound WhatsApp messages with optional URL append.
 */

/** Ensure `url` is present in the message body (appended when missing). */
export function ensureUrlInMessage(message: string, url?: string | null): string {
  const trimmed = message.trim();
  const trimmedUrl = url?.trim() ?? "";
  if (!trimmedUrl) return trimmed;
  if (trimmed.includes(trimmedUrl)) return trimmed;
  if (!trimmed) return trimmedUrl;
  return `${trimmed}\n\n${trimmedUrl}`;
}

/** Resolve the best available unit/property URL at send time. */
export function resolveMessageUnitUrl(
  unitUrl?: string | null,
  fallbackUrl?: string | null,
): string {
  const primary = unitUrl?.trim();
  if (primary) return primary;

  const fallback = fallbackUrl?.trim();
  if (fallback) return fallback;

  if (typeof window !== "undefined" && window.location?.href) {
    return window.location.href;
  }

  return "";
}

type TranslateFn = (key: string, fallback?: string | null) => string;

/** Build the default editable greeting for a property share message. */
export function buildDefaultReceiverMessage(
  receiverName: string | null | undefined,
  unitUrl: string | null | undefined,
  translate: TranslateFn,
): string {
  const name = receiverName?.trim() ?? "";
  const greeting = name
    ? translate(
        "sendMessageToOwner.defaultGreetingNamed",
        `Hello ${name},`,
      ).replace(/\{\{name\}\}/g, name)
    : translate("sendMessageToOwner.defaultGreeting", "Hello,");

  const body = translate(
    "sendMessageToOwner.defaultBody",
    "I wanted to share this property with you.",
  );

  const parts = [greeting, "", body];
  const url = unitUrl?.trim();
  if (url) {
    parts.push("", url);
  }
  return parts.join("\n");
}
