import { isOpenwaProvider, isUltramessageProvider, getAccountByKey } from "@/lib/whatsapp-messaging-provider";
import { formatPhoneForWhatsApp, copyToClipboard } from "@/utils/phone-utils";
import { phoneToE164 } from "@/components/phone/phone-utils";
import {
  clearWhatsappDeepLinkQueue,
  setWhatsappDeepLinkQueue,
} from "@/lib/whatsapp-deeplink-queue";

/**
 * Delay between navigating pre-reserved desktop tabs to wa.me drafts.
 * Tabs are claimed via about:blank during the click gesture so this delay
 * does not trigger the popup blocker.
 */
export const WHATSAPP_DEEPLINK_DELAY_MS = 5000;

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
 * True on phones/tablets where multi-tab popups fail and WhatsApp must open
 * via a single app handoff per tap.
 *
 * Covers: Android phones/tablets, iPhone, iPod, classic iPad UA, and
 * iPadOS 13+ “desktop” Safari (Macintosh + multi-touch).
 */
export function isTouchWhatsappClient() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  if (
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|iPad/i.test(ua)
  ) {
    return true;
  }

  // iPadOS 13+ requests a desktop Mac UA; detect via touch points.
  const touchPoints = Number(navigator.maxTouchPoints) || 0;
  if (navigator.platform === "MacIntel" && touchPoints > 1) {
    return true;
  }

  return false;
}

/** @deprecated Use isTouchWhatsappClient — kept for existing imports. */
export function isMobileWhatsappClient() {
  return isTouchWhatsappClient();
}

/**
 * Build deep-link URL.
 * Touch devices: api.whatsapp.com → OS hands off to the WhatsApp app with draft.
 * Desktop: wa.me → WhatsApp Web / Desktop in a new tab.
 */
export function buildWhatsappDeepLinkUrl(
  phone,
  message,
  { touch = false } = {},
) {
  const digits = String(phone || "").replace(/\D/g, "");
  const text = String(message ?? "").trim();
  if (!digits || !text) return "";

  if (touch) {
    // Universal / App Link — opens the installed app on iOS, Android, iPad.
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
 * Hand off to the WhatsApp app with a pre-filled draft.
 * Must run inside a user-gesture (click/tap).
 *
 * Uses location.assign so Universal/App Links switch to the app while
 * leaving the CRM page parked in memory (iOS Safari / Android Chrome).
 */
export function openWhatsappAppDraft(url) {
  if (!url || typeof window === "undefined") return false;
  window.location.assign(url);
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function navigateReservedWindow(win, url) {
  if (!win || !url) return false;
  try {
    win.location.href = url;
    return true;
  } catch {
    // Window may have been closed by the user.
    return false;
  }
}

/**
 * Open one WhatsApp tab/app draft per recipient.
 *
 * Desktop: sync-reserve N about:blank tabs during the click, then navigate
 * each to wa.me with delayMs pacing (default 5s) so all tabs open without
 * losing the user-gesture token.
 * Phones / tablets / iPad: opens the first chat in the WhatsApp app, then
 * queues the rest for a per-tap “Open next” bar (multi-tab popups are blocked).
 *
 * @returns {{
 *   opened: number,
 *   blocked: number,
 *   total: number,
 *   blockedUrls: string[],
 *   mode: 'desktop' | 'sequential',
 *   remaining: number,
 * }}
 */
export async function openWhatsappDeepLinks(
  recipients,
  { delayMs = WHATSAPP_DEEPLINK_DELAY_MS } = {},
) {
  const items = normalizeDeepLinkRecipients(recipients);
  const touch = isTouchWhatsappClient();
  let opened = 0;
  let blocked = 0;
  const blockedUrls = [];
  const paceMs = Math.max(0, Number(delayMs) || 0);

  const prepared = items
    .map(({ phone, message }, index) => {
      const url = buildWhatsappDeepLinkUrl(phone, message, { touch });
      if (!url) return null;
      return { phone, message, url, index };
    })
    .filter(Boolean);

  if (prepared.length === 0) {
    clearWhatsappDeepLinkQueue();
    return {
      opened: 0,
      blocked: items.length,
      total: items.length,
      blockedUrls: [],
      mode: touch ? "sequential" : "desktop",
      remaining: 0,
    };
  }

  // ── Touch (phone / tablet / iPad): one app handoff per tap ──────────────
  if (touch) {
    const [first, ...rest] = prepared;
    openWhatsappAppDraft(first.url);
    opened = 1;

    if (rest.length > 0) {
      setWhatsappDeepLinkQueue({
        total: prepared.length,
        openedCount: 1,
        remaining: rest.map(({ phone, message, url }) => ({
          phone,
          message,
          url,
        })),
      });
    } else {
      clearWhatsappDeepLinkQueue();
    }

    return {
      opened,
      blocked: 0,
      total: items.length,
      blockedUrls: [],
      mode: "sequential",
      remaining: rest.length,
    };
  }

  // ── Desktop: reserve blank tabs sync, then pace wa.me navigation ───────
  clearWhatsappDeepLinkQueue();

  /** @type {Array<{ win: Window | null, url: string }>} */
  const reserved = prepared.map(({ phone, url, index }) => {
    const win = openWhatsappWindow(
      "about:blank",
      `wa_deeplink_${phone}_${index}`,
    );
    return { win, url };
  });

  for (let i = 0; i < reserved.length; i += 1) {
    if (i > 0 && paceMs > 0) {
      await sleep(paceMs);
    }

    const { win, url } = reserved[i];
    if (!win) {
      blocked += 1;
      blockedUrls.push(url);
      continue;
    }

    if (navigateReservedWindow(win, url)) {
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
    mode: "desktop",
    remaining: 0,
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

  const touch = isTouchWhatsappClient();
  const url = buildWhatsappDeepLinkUrl(digits, text, { touch });

  if (touch) {
    openWhatsappAppDraft(url);
    return { ok: true, blocked: false, url };
  }

  const win = openWhatsappWindow(url, "_blank");
  return { ok: Boolean(win), blocked: !win, url };
}

/**
 * Toast/copy guidance when the browser blocks popup tabs, or sequential
 * mobile/tablet progress messaging.
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

  if (result.mode === "sequential") {
    if (result.remaining > 0) {
      success(
        translate(
          "whatsappSend.deeplinkSequentialStarted",
          "Opened WhatsApp (1 of {total}). Send the message, return here, then tap Open next.",
        ).replace("{total}", String(result.total)),
      );
      return;
    }
    success(
      translate(
        "whatsappSend.deeplinkOpened",
        "Opened WhatsApp for {count} recipient(s). Send each message manually.",
      ).replace("{count}", String(result.opened)),
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
