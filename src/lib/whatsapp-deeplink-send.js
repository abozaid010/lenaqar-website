import { isOpenwaProvider, isUltramessageProvider, getAccountByKey } from "@/lib/whatsapp-messaging-provider";
import { formatPhoneForWhatsApp, copyToClipboard } from "@/utils/phone-utils";
import { phoneToE164 } from "@/components/phone/phone-utils";

export const WHATSAPP_DEEPLINK_DELAY_MS = 1000;

/** Drop Ultramsg from outbound account lists (provider removed). */
export function filterOutboundWhatsappAccounts(accounts = []) {
  if (!Array.isArray(accounts)) return [];
  return accounts.filter(
    (account) => account && !isUltramessageProvider(account.platform),
  );
}

export function getOpenwaAccounts(accounts = []) {
  return filterOutboundWhatsappAccounts(accounts).filter((account) =>
    isOpenwaProvider(account.platform),
  );
}

/**
 * Account for API send, or null → use WhatsApp Web deep link.
 *
 * Rules:
 * - Explicit selection (OpenWA / Cloud API) → API
 * - Exactly one linked OpenWA account and nothing else → auto OpenWA
 * - OpenWA count === 0, or multi-account with no selection → deep link
 * - Cloud API never auto-selected
 */
export function resolveWhatsappApiSendAccount(
  messagingData,
  selectedAccountKey,
) {
  const accounts = filterOutboundWhatsappAccounts(
    messagingData?.accounts ?? [],
  );
  if (accounts.length === 0) return null;

  const key = String(selectedAccountKey || "").trim();
  if (key) {
    const selected = getAccountByKey(accounts, key);
    if (selected && !isUltramessageProvider(selected.platform)) {
      return selected;
    }
    return null;
  }

  if (accounts.length === 1 && isOpenwaProvider(accounts[0].platform)) {
    return accounts[0];
  }

  return null;
}

export function shouldUseWhatsappDeepLink(messagingData, selectedAccountKey) {
  return (
    resolveWhatsappApiSendAccount(messagingData, selectedAccountKey) == null
  );
}

function resolvePhoneDigits(phone) {
  const raw = String(phone ?? "").trim();
  if (!raw) return "";
  const e164 = phoneToE164(raw, "EG") || raw;
  return String(e164).replace(/\D/g, "");
}

/**
 * Normalize recipients into { phone, message } for wa.me.
 * Accepts bulk recipient shapes and simple phone/message pairs.
 */
export function normalizeDeepLinkRecipients(recipients = []) {
  if (!Array.isArray(recipients)) return [];

  return recipients
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const phone =
        item.phone_number ||
        item.phone ||
        item.chat_id ||
        item.owner_mobile ||
        "";
      const digits = resolvePhoneDigits(phone);
      const message = String(item.message ?? item.text ?? "").trim();
      if (!digits || !message) return null;
      return { phone: digits, message };
    })
    .filter(Boolean);
}

/**
 * Open wa.me tabs one-by-one with a delay (reduces popup blocking).
 * @returns {{ opened: number, blocked: number, total: number, blockedUrls: string[] }}
 */
export async function openWhatsappDeepLinks(
  recipients,
  { delayMs = WHATSAPP_DEEPLINK_DELAY_MS } = {},
) {
  const items = normalizeDeepLinkRecipients(recipients);
  let opened = 0;
  let blocked = 0;
  const blockedUrls = [];

  for (let i = 0; i < items.length; i += 1) {
    const { phone, message } = items[i];
    const url = formatPhoneForWhatsApp(phone, message);
    if (!url) {
      blocked += 1;
      continue;
    }

    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      opened += 1;
    } else {
      blocked += 1;
      blockedUrls.push(url);
    }

    if (i < items.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    opened,
    blocked,
    total: items.length,
    blockedUrls,
  };
}

/** Single-recipient deep link (copies message, opens one tab). */
export function openSingleWhatsappDeepLink(phoneNumber, message) {
  const digits = resolvePhoneDigits(phoneNumber);
  const text = String(message ?? "").trim();
  if (!digits || !text) {
    return { ok: false, blocked: true, url: "" };
  }

  copyToClipboard(
    text,
    () => {},
    () => {},
  );

  const url = formatPhoneForWhatsApp(digits, text);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  return { ok: Boolean(win), blocked: !win, url };
}

/**
 * Toast/copy guidance when the browser blocks popup tabs.
 * Copies remaining wa.me URLs so the user can open them manually.
 */
export function reportWhatsappDeepLinkResult(
  result,
  translate,
  { toastSuccess, toastError } = {},
) {
  const success = typeof toastSuccess === "function" ? toastSuccess : () => {};
  const error = typeof toastError === "function" ? toastError : success;

  if (!result || result.total === 0) {
    error(
      translate(
        "whatsappSend.deeplinkNoRecipients",
        "No valid phone numbers to open in WhatsApp.",
      ),
    );
    return;
  }

  if (result.blocked > 0 && result.blockedUrls?.length) {
    const joined = result.blockedUrls.join("\n");
    copyToClipboard(
      joined,
      () => {},
      () => {},
    );
  }

  if (result.opened > 0 && result.blocked === 0) {
    success(
      translate(
        "whatsappSend.deeplinkOpened",
        "Opened WhatsApp for {count} recipient(s). Send each message manually.",
      ).replace("{count}", String(result.opened)),
    );
    return;
  }

  if (result.opened > 0 && result.blocked > 0) {
    error(
      translate(
        "whatsappSend.deeplinkPartialBlocked",
        "Opened {opened} tab(s). {blocked} were blocked by the browser. Allow pop-ups for this site, then try again — blocked links were copied.",
      )
        .replace("{opened}", String(result.opened))
        .replace("{blocked}", String(result.blocked)),
    );
    return;
  }

  error(
    translate(
      "whatsappSend.deeplinkBlocked",
      "Your browser blocked WhatsApp tabs. Allow pop-ups for this site (address bar → pop-ups → Allow), then try again. Links were copied to your clipboard.",
    ),
  );
}
