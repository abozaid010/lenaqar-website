import { bffFetch } from "@/lib/bffFetch";
import {
  isOpenwaProvider,
  normalizeLinkedAutomatedWhatsappList,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";

/** Production OpenWA service is mounted under /webhook/openwa on api.lenaai.net */
const OPENWA_API_PREFIX = "/webhook/openwa";

/** Verified: GET {API_BASE_URL}/webhook/openwa/sessions/status (X-API-Key). */
export const OPENWA_BULK_SESSIONS_STATUS_PATH = `${OPENWA_API_PREFIX}/sessions/status`;

/** Verified: GET {API_BASE_URL}/webhook/openwa/session/status?session_id=… (X-API-Key). */
export const OPENWA_SINGLE_SESSION_STATUS_PATH = `${OPENWA_API_PREFIX}/session/status`;

const OPENWA_TERMINAL_FAILURE_STATUSES = new Set([
  "failed",
  "error",
  "banned",
  "conflict",
  "timeout",
]);

export const OPENWA_CONNECTION_LOG_PREFIX = "[openwa-connection]";

/** Dev-only connection traces (no-op in production). Step name only — never phones/payload. */
export function logOpenwaConnectionTrace(step, _payload = {}) {
  if (process.env.NODE_ENV !== "development") return;
  console.info(OPENWA_CONNECTION_LOG_PREFIX, step);
}

export function isRealOpenwaSessionId(sessionId) {
  const id = String(sessionId || "").trim();
  return id.length > 0 && !id.startsWith("phone:") && id !== "unknown";
}

export function normalizePhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function maskPhoneForLog(phone) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;
  if (digits.length <= 4) return `****${digits}`;
  return `****${digits.slice(-4)}`;
}

export function describeOpenwaAccountMatch(account, bulkList) {
  const sessionId = account.session_id?.trim() || "";
  const phoneDigits = normalizePhoneDigits(account.whatsapp_number);
  const match = findBulkSessionForAccount(bulkList, account);

  if (!match) {
    return {
      whatsapp_number: maskPhoneForLog(account.whatsapp_number),
      profile_session_id: sessionId || null,
      matched: false,
      match_by: null,
      bulk_session_id: null,
    };
  }

  const bulkSessionId = readBulkSessionId(match);
  const bulkPhone = readBulkSessionPhone(match);
  const matchBy =
    sessionId && bulkSessionId && sessionId === bulkSessionId
      ? "session_id"
      : phoneDigits && bulkPhone && phonesMatch(phoneDigits, bulkPhone)
        ? "phone"
        : "unknown";

  return {
    whatsapp_number: maskPhoneForLog(account.whatsapp_number),
    profile_session_id: sessionId || null,
    matched: true,
    match_by: matchBy,
    bulk_session_id: bulkSessionId || null,
    bulk_phone: maskPhoneForLog(bulkPhone),
    bulk_status: typeof match.status === "string" ? match.status : null,
    bulk_connected: Boolean(match.connected),
    bulk_has_qr: Boolean(normalizeQrImageValue(match.qr)),
  };
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

/**
 * Normalize QR payload from OpenWA bulk/single status responses.
 * Supports data URLs, http(s) URLs, and raw base64 strings.
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeQrImageValue(raw) {
  if (raw == null) return null;

  const value =
    typeof raw === "object" && raw !== null && typeof raw.image === "string"
      ? raw.image
      : typeof raw === "string"
        ? raw
        : "";

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
}

/** Whether OpenWA reported a non-recoverable session failure (show reconnect UI). */
export function isOpenwaSessionTerminalFailure(session) {
  if (!session || session.connected) return false;

  const status = String(session.status || "").toLowerCase();
  if (OPENWA_TERMINAL_FAILURE_STATUSES.has(status)) return true;

  return Boolean(session.error && status === "failed");
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

  const qrImage = normalizeQrImageValue(raw.qr);

  return {
    connected: Boolean(raw.connected),
    status: typeof raw.status === "string" ? raw.status : null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    qr: qrImage ? { image: qrImage } : null,
    error: null,
  };
}

/** Dev-only summary of bulk OpenWA payload (never logs full QR/base64; phones masked). */
export function summarizeOpenwaBulkPayloadForLog(bulkPayload) {
  const bulkList = extractBulkSessionsList(bulkPayload);
  return bulkList.map((item) => ({
    session_id: readBulkSessionId(item),
    connected: Boolean(item?.connected),
    status: typeof item?.status === "string" ? item.status : null,
    has_qr: Boolean(normalizeQrImageValue(item?.qr)),
    phone: maskPhoneForLog(readBulkSessionPhone(item)),
  }));
}

export function summarizeResolvedSessionsForLog(sessions) {
  return (sessions ?? []).map((session) => ({
    session_id: session.session_id,
    whatsapp_number: maskPhoneForLog(session.whatsapp_number),
    connected: Boolean(session.connected),
    status: session.status ?? null,
    has_qr: Boolean(session.qrImage),
    error: session.error ?? null,
    qr_pending_from_backend: isOpenwaSessionQrPending(session),
  }));
}

/** OpenWA reported a QR state but returned no image payload yet. */
export function isOpenwaSessionQrPending(session) {
  if (!session || session.connected || session.qrImage) return false;
  const status = String(session.status || "").toLowerCase();
  return status === "qr_ready" || status === "initializing";
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
  const matches = resolvedAccounts.map((account) =>
    describeOpenwaAccountMatch(account, bulkList)
  );

  return { resolvedAccounts, sessions, allConnected, matches };
}

/**
 * When bulk status omits QR, re-check each disconnected session via
 * GET /webhook/openwa/session/status?session_id=…
 */
export async function enrichOpenwaSessionsWithSingleStatus(
  sessions,
  apiBaseUrl,
  apiKey,
  { signal } = {}
) {
  const targets = sessions.filter(
    (session) =>
      !session.connected &&
      !session.qrImage &&
      isRealOpenwaSessionId(session.session_id)
  );

  if (targets.length === 0) {
    return { sessions, singleFetches: [] };
  }

  const updated = sessions.map((session) => ({ ...session }));
  const singleFetches = [];

  await Promise.all(
    targets.map(async (target) => {
      const sessionId = target.session_id.trim();
      try {
        const raw = await fetchOpenwaSessionStatusFromBackend(
          apiBaseUrl,
          sessionId,
          apiKey,
          { signal }
        );
        const qrImage = normalizeQrImageValue(raw?.qr);
        singleFetches.push({
          session_id: sessionId,
          status: typeof raw?.status === "string" ? raw.status : null,
          connected: Boolean(raw?.connected),
          has_qr: Boolean(qrImage),
          phone: typeof raw?.phone === "string" ? raw.phone : null,
        });

        const index = updated.findIndex(
          (session) => session.session_id === sessionId
        );
        if (index === -1) return;

        updated[index] = {
          ...updated[index],
          connected: Boolean(raw?.connected),
          status:
            typeof raw?.status === "string"
              ? raw.status
              : updated[index].status,
          qrImage: qrImage || updated[index].qrImage,
          whatsapp_number:
            updated[index].whatsapp_number ||
            (typeof raw?.phone === "string" ? raw.phone : "") ||
            "",
        };
        updated[index].qrPendingFromBackend = isOpenwaSessionQrPending(
          updated[index]
        );
      } catch (error) {
        singleFetches.push({
          session_id: sessionId,
          error: error instanceof Error ? error.message : "Single fetch failed",
        });
      }
    })
  );

  return { sessions: updated, singleFetches };
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
export async function fetchBulkOpenwaSessionsStatus(
  apiBaseUrl,
  apiKey,
  { signal } = {}
) {
  const url = `${apiBaseUrl}${OPENWA_BULK_SESSIONS_STATUS_PATH}`;
  const timeoutSignal = AbortSignal.timeout(20000);
  const requestSignal =
    signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([signal, timeoutSignal])
      : signal ?? timeoutSignal;

  const response = await bffFetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    signal: requestSignal,
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
  apiKey,
  { signal } = {}
) {
  const params = new URLSearchParams({ session_id: sessionId });
  const url = `${apiBaseUrl}${OPENWA_SINGLE_SESSION_STATUS_PATH}?${params.toString()}`;
  const timeoutSignal = AbortSignal.timeout(20000);
  const requestSignal =
    signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([signal, timeoutSignal])
      : signal ?? timeoutSignal;

  const response = await bffFetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    signal: requestSignal,
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
    const qrImage = normalizeQrImageValue(raw.qr);

    const session = {
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

    return {
      ...session,
      qrPendingFromBackend: isOpenwaSessionQrPending(session),
    };
  });
}
