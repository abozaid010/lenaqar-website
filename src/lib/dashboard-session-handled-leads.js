/**
 * Session-scoped set of lead user_ids the agent moved to bottom.
 * Survives reload + in-app navigation; clears when the browser tab closes.
 */

const STORAGE_KEY_PREFIX = "dashboard-session-handled-leads";

export function getSessionHandledLeadsKey(clientId) {
  const scope = clientId ? String(clientId) : "unknown";
  return `${STORAGE_KEY_PREFIX}:${scope}`;
}

function parseIds(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function readSessionHandledLeads(storageKey) {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(parseIds(sessionStorage.getItem(storageKey)));
  } catch {
    return new Set();
  }
}

export function writeSessionHandledLeads(storageKey, ids) {
  if (typeof window === "undefined") return;
  try {
    const list = Array.from(ids);
    if (list.length === 0) {
      sessionStorage.removeItem(storageKey);
      return;
    }
    sessionStorage.setItem(storageKey, JSON.stringify(list));
  } catch {
    // sessionStorage may be unavailable — degrade silently
  }
}

export function clearSessionHandledLeads(storageKey) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
