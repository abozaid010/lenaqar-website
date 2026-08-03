"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getWhatsappAccountKey } from "@/lib/whatsapp-messaging-provider";
import {
  isWhatsappAccountSelectionRestricted,
  resolveUserAssignedWhatsappNumber,
  resolveWhatsappAccountRestriction,
} from "@/lib/whatsapp-account-restriction";
import {
  resolveInitialWhatsappAccountKey,
  writeLastWhatsappAccountKey,
} from "@/lib/whatsapp-last-account";

const EMPTY_ACCOUNTS = [];

/**
 * WhatsApp send-from account selection with localStorage persistence per client + user.
 *
 * Restricted roles (editor / viewer / marketing): when the client has multiple
 * linked WhatsApp accounts, auto-select the account matching user.agent_number
 * (or temp mock by email) and lock the picker. Never uses user.phone_number.
 *
 * Single linked account: everyone uses that account by default (no agent lock).
 */
export function useWhatsappSelectedAccount(messagingData, clientId) {
  const clientInfo = LenaCookiesManager.getClientInfo();
  const userEmail = clientInfo?.email ?? "";
  // Prefer authorization role over product client_type (same as getRoleFromToken).
  const role = clientInfo?.role ?? clientInfo?.client_type ?? null;
  // agent_number from API, else mock file — never phone_number.
  const assignedNumber = resolveUserAssignedWhatsappNumber(clientInfo);

  const [selectedPlatform, setSelectedPlatformState] = useState("");
  const [initializedKey, setInitializedKey] = useState(null);

  const accounts = messagingData?.accounts ?? EMPTY_ACCOUNTS;
  const accountsFingerprint = useMemo(
    () =>
      accounts
        .map((account) => getWhatsappAccountKey(account))
        .filter(Boolean)
        .join("|"),
    [accounts],
  );

  const restriction = useMemo(
    () =>
      resolveWhatsappAccountRestriction({
        role,
        user: {
          email: clientInfo?.email,
          agent_number: clientInfo?.agent_number,
        },
        accounts,
        getAccountKey: getWhatsappAccountKey,
      }),
    [
      role,
      assignedNumber,
      clientInfo?.email,
      clientInfo?.agent_number,
      accounts,
      accountsFingerprint,
    ],
  );

  useEffect(() => {
    setSelectedPlatformState("");
    setInitializedKey(null);
  }, [clientId]);

  useEffect(() => {
    if (!messagingData || !clientId) return;

    const initKey = `${clientId}::${accountsFingerprint}::restricted:${restriction.restricted}:${restriction.matchedAccountKey}`;
    if (initializedKey === initKey) return;

    // Restricted roles: force matching account (or empty when none) — ignore last-used.
    if (restriction.restricted) {
      setSelectedPlatformState(restriction.matchedAccountKey || "");
      setInitializedKey(initKey);
      return;
    }

    const next = resolveInitialWhatsappAccountKey(
      accounts,
      clientId,
      userEmail,
    );
    setSelectedPlatformState(next);
    setInitializedKey(initKey);
  }, [
    messagingData,
    clientId,
    userEmail,
    accounts,
    accountsFingerprint,
    initializedKey,
    restriction.restricted,
    restriction.matchedAccountKey,
  ]);

  const setSelectedPlatform = useCallback(
    (key) => {
      // Restricted roles cannot switch or override the assigned account.
      if (restriction.isSelectionLocked) return;

      const next = key ?? "";
      setSelectedPlatformState(next);
      if (clientId) {
        // Persist selection; empty = WhatsApp Web (clear last-used account).
        writeLastWhatsappAccountKey(clientId, userEmail, next);
      }
    },
    [clientId, userEmail, restriction.isSelectionLocked],
  );

  return {
    selectedPlatform,
    setSelectedPlatform,
    isWhatsappAccountRestricted: restriction.restricted,
    isAccountSelectionLocked: restriction.isSelectionLocked,
    isWhatsappSendBlocked: restriction.isSendBlocked,
    whatsappRestrictionCode: restriction.code,
    assignedWhatsappNumber: restriction.assignedNumber,
  };
}

/** Re-export for callers that only need the role check. */
export { isWhatsappAccountSelectionRestricted };
