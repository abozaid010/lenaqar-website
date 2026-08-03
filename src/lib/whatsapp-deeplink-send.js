import { isOpenwaProvider, isUltramessageProvider, getAccountByKey } from "@/lib/whatsapp-messaging-provider";
import { formatPhoneForWhatsApp, copyToClipboard } from "@/utils/phone-utils";
import { phoneToE164 } from "@/components/phone/phone-utils";

/**
 * @deprecated Delay between opens breaks the user-gesture token and causes
 * browsers to block tabs 2..n. Kept for call-site compatibility; ignored.
 */
export const WHATSAPP_DEEPLINK_DELAY_MS = 0;

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

export function isMobileWhatsappClient() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

/**
 * Build deep-link URL. On mobile, prefer api.whatsapp.com so the OS hands
 * off to the WhatsApp app with a pre-filled draft.
 */
export function buildWhatsappDeepLinkUrl(phone, message, { mobile = false } = {}) {
  const digits = String(phone || "").replace(/\D/g, "");
  const text = String(message ?? "").trim();
  if (!digits || !text) return "";

  if (mobile) {
    return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
  }
  return formatPhoneForWhatsApp(digits, text);
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
 * Open a WhatsApp URL without `noopener` in windowFeatures.
 * Features including noopener make window.open() always return null, which
 * incorrectly marks successful opens as blocked.
 */
function openWhatsappWindow(url, target) {
  const win = window.open(url, target);
  if (win) {
    try {
      win.opener = null;
    } catch {
      // Cross-origin / restricted — ignore.
    }
  }
  return win;
}

/**
 * Open one WhatsApp tab/app draft per recipient.
 *
 * Desktop: opens N tabs synchronously in the same click gesture (delaying
 * between opens drops user activation and the browser blocks tabs 2..n).
 * Mobile: hands off to the WhatsApp app with a pre-filled draft
 * (location.assign for a single recipient; sync window.open for many).
 *
 * @returns {{ opened: number, blocked: number, total: number, blockedUrls: string[] }}
 */
export async function openWhatsappDeepLinks(
  recipients,
  // delayMs intentionally ignored — see WHATSAPP_DEEPLINK_DELAY_MS.
  { delayMs: _delayMs } = {},
) {
  const items = normalizeDeepLinkRecipients(recipients);
  const mobile = isMobileWhatsappClient();
  let opened = 0;
  let blocked = 0;
  const blockedUrls = [];

  const prepared = items
    .map(({ phone, message }, index) => {
      const url = buildWhatsappDeepLinkUrl(phone, message, { mobile });
      if (!url) return null;
      return { phone, message, url, index };
    })
    .filter(Boolean);

  if (prepared.length === 0) {
    return { opened: 0, blocked: items.length, total: items.length, blockedUrls };
  }

  // Single recipient on mobile: navigate current tab → WhatsApp app draft.
  if (mobile && prepared.length === 1) {
    window.location.assign(prepared[0].url);
    return {
      opened: 1,
      blocked: 0,
      total: items.length,
      blockedUrls: [],
    };
  }

  // Open every tab synchronously in this call stack. Any delay/await between
  // opens drops the user-gesture token and browsers block tabs 2..n.
  // Unique targets avoid reusing a single tab for multiple recipients.
  for (let i = 0; i < prepared.length; i += 1) {
    const { phone, url, index } = prepared[i];
    const win = openWhatsappWindow(url, `wa_deeplink_${phone}_${index}`);
    if (win) {
      opened += 1;
    } else {
      blocked += 1;
      blockedUrls.push(url);
    }
  }

  return {
    opened,
    blocked,
    total: items.length,
    blockedUrls,
  };
}

/** Single-recipient deep link (copies message, opens WhatsApp). */
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

  const mobile = isMobileWhatsappClient();
  const url = buildWhatsappDeepLinkUrl(digits, text, { mobile });

  if (mobile) {
    window.location.assign(url);
    return { ok: true, blocked: false, url };
  }

  const win = openWhatsappWindow(url, "_blank");
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
