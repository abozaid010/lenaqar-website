import { getWhatsappAccountKey } from "@/lib/whatsapp-messaging-provider";

const STORAGE_PREFIX = "lena:whatsapp:lastAccount";

export function getWhatsappLastAccountStorageKey(clientId, userEmail) {
  const client = String(clientId || "unknown").trim() || "unknown";
  const user = String(userEmail || "")
    .trim()
    .toLowerCase() || "anonymous";
  return `${STORAGE_PREFIX}:${client}:${user}`;
}

/** Read last-used WhatsApp account key for this client + logged-in user. */
export function readLastWhatsappAccountKey(clientId, userEmail) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      getWhatsappLastAccountStorageKey(clientId, userEmail),
    );
    const value = String(raw || "").trim();
    return value || null;
  } catch {
    return null;
  }
}

/** Persist last-used WhatsApp account key for this client + logged-in user. */
export function writeLastWhatsappAccountKey(clientId, userEmail, accountKey) {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getWhatsappLastAccountStorageKey(clientId, userEmail);
    const value = String(accountKey || "").trim();
    if (!value) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, value);
  } catch {
    // Ignore quota / private mode failures.
  }
}

/**
 * Resolve account selection when messaging config loads:
 * - 0 accounts → ""
 * - 1 account → that account
 * - multiple → last saved if still linked, else ""
 */
export function resolveInitialWhatsappAccountKey(accounts, clientId, userEmail) {
  if (!Array.isArray(accounts) || accounts.length === 0) return "";

  if (accounts.length === 1) {
    return getWhatsappAccountKey(accounts[0]) || "";
  }

  const saved = readLastWhatsappAccountKey(clientId, userEmail);
  if (
    saved &&
    accounts.some((account) => getWhatsappAccountKey(account) === saved)
  ) {
    return saved;
  }

  return "";
}
