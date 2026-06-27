import { bffFetch } from "@/lib/bffFetch";
import {
  isOpenwaProvider,
  normalizeLinkedAutomatedWhatsappList,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";

/** Production OpenWA service is mounted under /webhook/openwa on api.lenaai.net */
const OPENWA_API_PREFIX = "/webhook/openwa";

export function normalizePhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * OpenWA accounts from profile — session IDs may be absent on client-facing profile.
 * @param {unknown} linked
 * @returns {Array<{ session_id: string, whatsapp_number: string, lookupKey: string }>}
 */
export function getOpenwaProfileAccounts(linked) {
  return normalizeLinkedAutomatedWhatsappList(linked)
    .filter((account) => isOpenwaProvider(account.platform))
    .map((account) => {
      const session_id = account.openwa_session_id?.trim() || "";
      const whatsapp_number = resolveSenderPhoneNumber(account) || "";
      const phoneKey = normalizePhoneDigits(whatsapp_number);
      return {
        session_id,
        whatsapp_number,
        lookupKey: session_id || (phoneKey ? `phone:${phoneKey}` : ""),
      };
    })
    .filter((account) => account.session_id || account.whatsapp_number);
}

/** @deprecated Use getOpenwaProfileAccounts */
export function getOpenwaLinkedAccounts(linked) {
  return getOpenwaProfileAccounts(linked).filter((account) => account.session_id);
}

function extractBulkSessionsList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function readBulkSessionId(item) {
  const id = item?.session_id ?? item?.sessionId ?? item?.id;
  return typeof id === "string" ? id.trim() : "";
}

function readBulkSessionPhone(item) {
  const phone = item?.phone ?? item?.whatsapp_number ?? item?.number;
  return normalizePhoneDigits(phone);
}

export function findBulkSessionForAccount(bulkList, account) {
  if (!Array.isArray(bulkList) || !account) return null;

  const sessionId = account.session_id?.trim() || "";
  const phoneDigits = normalizePhoneDigits(account.whatsapp_number);

  return (
    bulkList.find((item) => {
      const itemId = readBulkSessionId(item);
      if (sessionId && itemId && itemId === sessionId) return true;
      return phonesMatch(phoneDigits, readBulkSessionPhone(item));
    }) ?? null
  );
}

export function mapBulkSessionToStatus(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      connected: false,
      status: "error",
      error: "Session status not found",
    };
  }

  const qrImage =
    typeof raw.qr?.image === "string" && raw.qr.image.trim()
      ? raw.qr.image.trim()
      : typeof raw.qr === "string" && raw.qr.trim()
        ? raw.qr.trim()
        : null;

  return {
    connected: Boolean(raw.connected),
    status: typeof raw.status === "string" ? raw.status : null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    qr: qrImage ? { image: qrImage } : null,
    error: null,
  };
}

/**
 * Resolve profile accounts + statuses from one bulk /sessions/status response.
 * @param {Array<{ session_id: string, whatsapp_number: string, lookupKey: string }>} accounts
 * @param {unknown} bulkPayload
 */
export function resolveOpenwaStatusesFromBulk(accounts, bulkPayload) {
  const bulkList = extractBulkSessionsList(bulkPayload);

  const resolvedAccounts = accounts.map((account) => {
    if (account.session_id) return account;

    const match = findBulkSessionForAccount(bulkList, account);
    const session_id = match ? readBulkSessionId(match) : "";

    return {
      ...account,
      session_id,
      lookupKey: session_id || account.lookupKey,
    };
  });

  const statusByKey = {};
  for (const account of resolvedAccounts) {
    const key = account.session_id || account.lookupKey;
    const match = findBulkSessionForAccount(bulkList, account);
    statusByKey[key] = match
      ? mapBulkSessionToStatus(match)
      : {
          connected: false,
          status: "error",
          error: "OpenWA session status not found for this number",
        };
  }

  const sessions = mergeOpenwaSessionStatuses(resolvedAccounts, statusByKey);
  const allConnected = sessions.every((session) => session.connected);

  return { resolvedAccounts, sessions, allConnected };
}

function phonesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.endsWith(b) || b.endsWith(a);
}

/**
 * @param {string} apiBaseUrl
 * @param {string} apiKey
 */
export async function fetchBulkOpenwaSessionsStatus(apiBaseUrl, apiKey) {
  const url = `${apiBaseUrl}${OPENWA_API_PREFIX}/sessions/status`;
  const response = await bffFetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      data?.message ||
      "Failed to fetch OpenWA sessions status";
    const error = new Error(
      typeof message === "string" ? message : "Failed to fetch OpenWA sessions status"
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Fill missing session_id values using bulk /openwa/sessions/status when available.
 * @param {Array<{ session_id: string, whatsapp_number: string, lookupKey: string }>} accounts
 * @param {string} apiBaseUrl
 * @param {string} apiKey
 */
export async function resolveOpenwaSessionIds(accounts, apiBaseUrl, apiKey) {
  const needsLookup = accounts.some(
    (account) => !account.session_id && account.whatsapp_number
  );
  if (!needsLookup) return accounts;

  try {
    const bulk = await fetchBulkOpenwaSessionsStatus(apiBaseUrl, apiKey);
    const list = extractBulkSessionsList(bulk);

    return accounts.map((account) => {
      if (account.session_id) return account;

      const digits = normalizePhoneDigits(account.whatsapp_number);
      const match = list.find((item) =>
        phonesMatch(digits, readBulkSessionPhone(item))
      );
      const session_id = match ? readBulkSessionId(match) : "";

      return {
        ...account,
        session_id,
        lookupKey: session_id || account.lookupKey,
      };
    });
  } catch {
    return accounts;
  }
}

/**
 * @param {string} apiBaseUrl
 * @param {string} sessionId
 * @param {string} apiKey
 */
export async function fetchOpenwaSessionStatusFromBackend(
  apiBaseUrl,
  sessionId,
  apiKey
) {
  const params = new URLSearchParams({ session_id: sessionId });
  const url = `${apiBaseUrl}${OPENWA_API_PREFIX}/session/status?${params.toString()}`;

  const response = await bffFetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      data?.message ||
      "Failed to fetch OpenWA session status";
    const error = new Error(
      typeof message === "string" ? message : "Failed to fetch OpenWA session status"
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * @param {Array<{ session_id: string, whatsapp_number: string, lookupKey?: string }>} accounts
 * @param {Record<string, unknown>} statusByKey
 */
export function mergeOpenwaSessionStatuses(accounts, statusByKey) {
  return accounts.map((account) => {
    const keys = [account.session_id, account.lookupKey].filter(Boolean);
    const raw = keys.reduce((found, key) => found ?? statusByKey[key], null) ?? {};
    const connected = Boolean(raw.connected);
    const qrImage =
      typeof raw.qr?.image === "string" && raw.qr.image.trim()
        ? raw.qr.image.trim()
        : null;

    return {
      session_id: account.session_id || account.lookupKey || account.whatsapp_number,
      whatsapp_number:
        account.whatsapp_number ||
        (typeof raw.phone === "string" ? raw.phone : "") ||
        "",
      connected,
      status: typeof raw.status === "string" ? raw.status : null,
      qrImage,
      error: typeof raw.error === "string" ? raw.error : null,
    };
  });
}
