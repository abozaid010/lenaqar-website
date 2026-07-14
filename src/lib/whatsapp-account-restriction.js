/**
 * WhatsApp send-from account restrictions for team roles.
 *
 * Restricted roles (editor / viewer / marketing) may only send from the linked
 * WhatsApp account whose number matches their assigned agent number
 * (user.agent_number, or temporary mock when API field is missing).
 *
 * Only applies when the client has **more than one** linked WhatsApp account.
 * With a single linked account, every user on that client uses it by default.
 *
 * Never uses user.phone_number — that is the user's personal contact, not WA sender.
 *
 * Unrestricted roles (admin, owner, etc.) keep free account selection.
 *
 * Kept free of imports from whatsapp-messaging-provider to avoid circular deps
 * with send helpers that also call into this module.
 */

import { phoneToE164 } from "@/components/phone/phone-utils";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getMockWhatsappAgentNumberByEmail } from "@/mocks/whatsapp-agent-numbers";

/** Roles that must send only from their assigned WhatsApp number. */
export const WHATSAPP_ACCOUNT_RESTRICTED_ROLES = [
  "editor",
  "viewer",
  "marketing",
];

/** User has no agent_number (API or mock) assigned. */
export const WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE =
  "WHATSAPP_USER_PHONE_NOT_ASSIGNED";

/** Assigned phone does not match any linked client WhatsApp account. */
export const WHATSAPP_ACCOUNT_NOT_LINKED_CODE = "WHATSAPP_ACCOUNT_NOT_LINKED";

/** Selected / payload account does not match the restricted user's number. */
export const WHATSAPP_ACCOUNT_MISMATCH_CODE = "WHATSAPP_ACCOUNT_MISMATCH";

function normalizeRole(role) {
  if (role == null || typeof role !== "string") return "";
  return role.toLowerCase().trim();
}

function normalizePhone(raw) {
  if (raw == null || raw === "") return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

/** Sender phone from a linked account (whatsapp_number or sender_phone_number). */
function accountSenderPhone(account) {
  if (!account || typeof account !== "object") return "";
  return (
    normalizePhone(account.sender_phone_number) ||
    normalizePhone(account.whatsapp_number) ||
    ""
  );
}

/** True when the client has multiple linked WhatsApp accounts (selection applies). */
export function clientHasMultipleWhatsappAccounts(accounts) {
  return Array.isArray(accounts) && accounts.length > 1;
}

/**
 * Whether this authorization role is limited to its assigned WhatsApp number.
 * Still requires multiple linked accounts before selection is enforced.
 */
export function isWhatsappAccountSelectionRestricted(role) {
  const r = normalizeRole(role);
  return WHATSAPP_ACCOUNT_RESTRICTED_ROLES.includes(r);
}

/**
 * Resolve the WhatsApp sender number assigned to the logged-in user.
 *
 * Priority:
 * 1. user.agent_number (backend field — not always on production yet)
 * 2. Temporary mock file keyed by email (until API is live)
 *
 * Never uses user.phone_number.
 */
export function resolveUserAssignedWhatsappNumber(user) {
  if (!user || typeof user !== "object") return "";

  // Prefer live API field when present.
  const fromApi = user.agent_number;
  if (fromApi != null && String(fromApi).trim() !== "") {
    const normalized = normalizePhone(fromApi);
    return normalized || String(fromApi).trim();
  }

  // TEMPORARY: mock until agent_number ships in production.
  const fromMock = getMockWhatsappAgentNumberByEmail(user.email);
  if (!fromMock) return "";
  return normalizePhone(fromMock) || fromMock;
}

/** Digits-only form for comparing differently formatted numbers. */
export function whatsappPhoneDigits(raw) {
  const normalized = normalizePhone(raw) || String(raw || "").trim();
  return normalized.replace(/\D/g, "");
}

/**
 * Compare two phones loosely (E.164 vs local EG digits).
 */
export function whatsappPhonesMatch(a, b) {
  const da = whatsappPhoneDigits(a);
  const db = whatsappPhoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  // Egypt: strip leading country code 20 when one side includes it.
  const stripEg = (d) =>
    d.startsWith("20") && d.length >= 12 ? d.slice(2) : d;
  return stripEg(da) === stripEg(db);
}

/**
 * Find the linked WhatsApp account whose sender number matches assignedNumber.
 * `getAccountKey` is injected to avoid importing messaging-provider (circular).
 */
export function findMatchingWhatsappAccount(
  accounts,
  assignedNumber,
  getAccountKey = null,
) {
  if (!assignedNumber || !Array.isArray(accounts) || accounts.length === 0) {
    return null;
  }
  const matched =
    accounts.find((account) =>
      whatsappPhonesMatch(accountSenderPhone(account), assignedNumber),
    ) || null;
  if (!matched) return null;
  if (typeof getAccountKey === "function" && !getAccountKey(matched)) {
    return null;
  }
  return matched;
}

/**
 * Read role + user fields used for WhatsApp restriction (client cookie).
 * Prefers authorization `role` over product `client_type` (same as getRoleFromToken).
 */
export function getCurrentUserWhatsappIdentity(userOverride = null) {
  const user =
    userOverride && typeof userOverride === "object"
      ? userOverride
      : typeof window !== "undefined"
        ? LenaCookiesManager.getClientInfo()
        : null;
  if (!user || typeof user !== "object") {
    return { user: null, role: null, assignedNumber: "" };
  }
  const role = user.role ?? user.client_type ?? null;
  return {
    user,
    role,
    assignedNumber: resolveUserAssignedWhatsappNumber(user),
  };
}

/**
 * Resolve selection + send eligibility for the current user against linked accounts.
 *
 * Agent matching / lock only runs when:
 * - role is restricted (editor / viewer / marketing), AND
 * - client has more than one linked WhatsApp account.
 *
 * Single linked account → no lock; default selection picks that account for everyone.
 *
 * @param {object} options
 * @param {(account: object) => string} [options.getAccountKey] - stable account key fn
 */
export function resolveWhatsappAccountRestriction({
  role,
  user,
  accounts = [],
  getAccountKey = null,
} = {}) {
  const assignedNumber = resolveUserAssignedWhatsappNumber(user);

  // Single (or zero) linked account: no agent-based selection — use default behavior.
  if (!clientHasMultipleWhatsappAccounts(accounts)) {
    return {
      restricted: false,
      assignedNumber,
      matchedAccount: null,
      matchedAccountKey: "",
      isSelectionLocked: false,
      isSendBlocked: false,
      code: null,
    };
  }

  if (!isWhatsappAccountSelectionRestricted(role)) {
    return {
      restricted: false,
      assignedNumber,
      matchedAccount: null,
      matchedAccountKey: "",
      isSelectionLocked: false,
      isSendBlocked: false,
      code: null,
    };
  }

  if (!assignedNumber) {
    return {
      restricted: true,
      assignedNumber: "",
      matchedAccount: null,
      matchedAccountKey: "",
      isSelectionLocked: true,
      isSendBlocked: true,
      code: WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE,
    };
  }

  const matchedAccount = findMatchingWhatsappAccount(
    accounts,
    assignedNumber,
    getAccountKey,
  );
  const matchedAccountKey =
    matchedAccount && typeof getAccountKey === "function"
      ? getAccountKey(matchedAccount) || ""
      : "";

  if (!matchedAccount || (getAccountKey && !matchedAccountKey)) {
    return {
      restricted: true,
      assignedNumber,
      matchedAccount: null,
      matchedAccountKey: "",
      isSelectionLocked: true,
      isSendBlocked: true,
      code: WHATSAPP_ACCOUNT_NOT_LINKED_CODE,
    };
  }

  return {
    restricted: true,
    assignedNumber,
    matchedAccount,
    matchedAccountKey,
    isSelectionLocked: true,
    isSendBlocked: false,
    code: null,
  };
}

/**
 * Action-layer guard: restricted users may only use their matched linked account
 * when the client has multiple linked WhatsApp accounts.
 * Call before API sends so UI/state tampering cannot pick another sender.
 *
 * @param {object} options
 * @param {object|null} options.account - selected / effective send account
 * @param {object[]|null} [options.accounts] - all linked accounts (needed for single-account bypass)
 * @returns {{ ok: true } | { ok: false, code: string }}
 */
export function assertWhatsappSenderAllowedForUser({
  account,
  accounts = null,
  user: userOverride = null,
  role: roleOverride = null,
} = {}) {
  const identity = getCurrentUserWhatsappIdentity(userOverride);
  const role = roleOverride ?? identity.role;
  const user = userOverride ?? identity.user;

  // Single linked account: any user on this client may send from it.
  if (Array.isArray(accounts) && !clientHasMultipleWhatsappAccounts(accounts)) {
    return { ok: true };
  }

  if (!isWhatsappAccountSelectionRestricted(role)) {
    return { ok: true };
  }

  const assignedNumber = resolveUserAssignedWhatsappNumber(user);
  if (!assignedNumber) {
    return { ok: false, code: WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE };
  }

  const senderPhone = accountSenderPhone(account);
  if (!senderPhone || !whatsappPhonesMatch(senderPhone, assignedNumber)) {
    return { ok: false, code: WHATSAPP_ACCOUNT_MISMATCH_CODE };
  }

  return { ok: true };
}

/** Localized message for restriction error codes (UI + toast). */
export function getWhatsappAccountRestrictionMessage(code, translate) {
  if (code === WHATSAPP_USER_PHONE_NOT_ASSIGNED_CODE) {
    return translate(
      "whatsappSend.userPhoneNotAssigned",
      "Your account does not have a WhatsApp number assigned. Please contact your administrator.",
    );
  }
  if (
    code === WHATSAPP_ACCOUNT_NOT_LINKED_CODE ||
    code === WHATSAPP_ACCOUNT_MISMATCH_CODE
  ) {
    return translate(
      "whatsappSend.noLinkedAccountForAssignedPhone",
      "No WhatsApp account is linked to your assigned phone number.",
    );
  }
  return translate(
    "whatsappSend.noLinkedAccountForAssignedPhone",
    "No WhatsApp account is linked to your assigned phone number.",
  );
}
