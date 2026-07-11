"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getWhatsappAccountKey } from "@/lib/whatsapp-messaging-provider";
import {
  resolveInitialWhatsappAccountKey,
  writeLastWhatsappAccountKey,
} from "@/lib/whatsapp-last-account";

const EMPTY_ACCOUNTS = [];

/**
 * WhatsApp send-from account selection with localStorage persistence per client + user.
 */
export function useWhatsappSelectedAccount(messagingData, clientId) {
  const userEmail = LenaCookiesManager.getClientInfo()?.email ?? "";
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

  useEffect(() => {
    setSelectedPlatformState("");
    setInitializedKey(null);
  }, [clientId]);

  useEffect(() => {
    if (!messagingData || !clientId) return;

    const initKey = `${clientId}::${accountsFingerprint}`;
    if (initializedKey === initKey) return;

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
  ]);

  const setSelectedPlatform = useCallback(
    (key) => {
      const next = key ?? "";
      setSelectedPlatformState(next);
      if (next && clientId) {
        writeLastWhatsappAccountKey(clientId, userEmail, next);
      }
    },
    [clientId, userEmail],
  );

  return { selectedPlatform, setSelectedPlatform };
}
