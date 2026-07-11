import { getSalesData } from "@/components/services/serviceFetching";

/**
 * @typedef {{ email: string, name: string }} DashboardTeamMember
 */

/** @type {'unset'|'ok'|'error'} */
let cacheKind = "unset";
/** @type {DashboardTeamMember[]|null} */
let cachedMembers = null;
/** @type {Promise<DashboardTeamMember[]|null>|null} */
let inFlight = null;

const STORAGE_KEY_PREFIX = "dashboard-team-members:v1:";

/**
 * @param {string | null | undefined} clientId
 * @returns {string | null}
 */
function getStorageKey(clientId) {
  const id = typeof clientId === "string" ? clientId.trim().toLowerCase() : "";
  if (!id) return null;
  return `${STORAGE_KEY_PREFIX}${id}`;
}

/**
 * Normalize Team page rows (`sales-employees/list-all-employees`) into
 * author options. Dedupes by email (case-insensitive).
 * @param {unknown} rows
 * @returns {DashboardTeamMember[]}
 */
export function normalizeTeamMembers(rows) {
  if (!Array.isArray(rows)) return [];

  /** @type {Map<string, DashboardTeamMember>} */
  const byEmail = new Map();
  for (const row of rows) {
    const email =
      typeof row?.email === "string" ? row.email.trim() : "";
    if (!email) continue;
    const key = email.toLowerCase();
    const name =
      typeof row?.name === "string" ? row.name.trim() : "";
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, { email, name });
      continue;
    }
    // Prefer a row that has a display name.
    if (!existing.name && name) {
      byEmail.set(key, { email: existing.email, name });
    }
  }

  return Array.from(byEmail.values()).sort((a, b) => {
    const labelA = (a.name || a.email).toLowerCase();
    const labelB = (b.name || b.email).toLowerCase();
    return labelA.localeCompare(labelB);
  });
}

/**
 * @param {unknown} value
 * @returns {DashboardTeamMember[]|null}
 */
function parseCachedMembers(value) {
  if (!Array.isArray(value)) return null;
  const members = normalizeTeamMembers(
    value.map((item) => {
      if (typeof item === "string") {
        return { email: item, name: "" };
      }
      if (item && typeof item === "object") {
        return {
          email: typeof item.email === "string" ? item.email : "",
          name: typeof item.name === "string" ? item.name : "",
        };
      }
      return null;
    }),
  );
  return members;
}

/**
 * @param {string | null | undefined} clientId
 * @returns {DashboardTeamMember[]|null}
 */
export function readCachedDashboardTeamMembers(clientId) {
  if (cacheKind === "ok" && Array.isArray(cachedMembers)) {
    return cachedMembers;
  }
  if (typeof window === "undefined") return null;
  const key = getStorageKey(clientId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return parseCachedMembers(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} clientId
 * @param {DashboardTeamMember[]} members
 */
function writeLocalCache(clientId, members) {
  if (typeof window === "undefined") return;
  const key = getStorageKey(clientId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(members));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Loads team members via the same API as TeamContent
 * (`getSalesData` → `sales-employees/list-all-employees`) once per SPA session.
 * Mirrored into localStorage for faster reopen.
 *
 * @param {string | null | undefined} clientId
 * @returns {Promise<DashboardTeamMember[]|null>}
 */
export async function loadDashboardTeamMembersOnce(clientId) {
  if (cacheKind === "ok") return cachedMembers;
  if (cacheKind === "error") return null;
  if (!inFlight) {
    inFlight = getSalesData()
      .then((result) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        // Match Team page: status false means no access. Still accept a data
        // array when status is omitted but members were returned.
        if (result?.status === false && rows.length === 0) {
          cacheKind = "error";
          cachedMembers = null;
          return null;
        }
        const members = normalizeTeamMembers(rows);
        cachedMembers = members;
        cacheKind = "ok";
        writeLocalCache(clientId, members);
        return cachedMembers;
      })
      .catch((err) => {
        console.error(
          "[dashboard] team members fetch failed",
          err?.message ?? err,
        );
        cacheKind = "error";
        cachedMembers = null;
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** @deprecated Use {@link readCachedDashboardTeamMembers} */
export function readCachedDashboardTeamEmails(clientId) {
  const members = readCachedDashboardTeamMembers(clientId);
  return members ? members.map((m) => m.email) : null;
}

/** @deprecated Use {@link loadDashboardTeamMembersOnce} */
export async function loadDashboardTeamEmailsOnce(clientId) {
  const members = await loadDashboardTeamMembersOnce(clientId);
  return members ? members.map((m) => m.email) : null;
}
