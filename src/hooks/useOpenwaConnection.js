"use client";

import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { useOpenwaSessionsStatus } from "@/hooks/useOpenwaSessionsStatus";
import {
  isOpenwaProvider,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Once per browser tab/session — survives navigating away from leads and back. */
const OPENWA_AUTO_PROMPT_SESSION_KEY = "openwa-auto-prompt-done";

function hasAutoPromptedThisSession() {
  try {
    return sessionStorage.getItem(OPENWA_AUTO_PROMPT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markAutoPromptedThisSession() {
  try {
    sessionStorage.setItem(OPENWA_AUTO_PROMPT_SESSION_KEY, "1");
  } catch {
    // private mode / quota — degrade to in-memory ref only
  }
}

export function useOpenwaConnection({
  /** Leads: check once per website session; open dialog only when not fully connected */
  autoOpenOnMount = false,
} = {}) {
  const [showOpenwaDialog, setShowOpenwaDialog] = useState(false);
  const hasPromptedOpenwaRef = useRef(false);
  const { data: messagingConfig, isSuccess: isMessagingReady } =
    useMessagingProviderConfig();

  const openwaProfileAccounts = useMemo(() => {
    const accounts = messagingConfig?.accounts ?? [];
    return accounts
      .filter((account) => isOpenwaProvider(account.platform))
      .map((account) => {
        const whatsapp_number = resolveSenderPhoneNumber(account) || "";
        return {
          session_id:
            account.openwa_session_id?.trim() ||
            (whatsapp_number ? `phone:${whatsapp_number}` : "unknown"),
          whatsapp_number,
          connected: false,
          status: null,
          qrImage: null,
          error: null,
        };
      });
  }, [messagingConfig]);

  const hasOpenwaLinkedAccounts = openwaProfileAccounts.length > 0;

  const pollWhileOpen = showOpenwaDialog && hasOpenwaLinkedAccounts;
  const openwaStatusQuery = useOpenwaSessionsStatus({ pollWhileOpen });
  const { refetch } = openwaStatusQuery;

  const fetchStatus = useCallback(() => {
    if (!hasOpenwaLinkedAccounts) {
      return Promise.resolve({ data: undefined });
    }
    return refetch();
  }, [hasOpenwaLinkedAccounts, refetch]);

  useEffect(() => {
    if (!showOpenwaDialog || !hasOpenwaLinkedAccounts) return;
    void refetch();
  }, [showOpenwaDialog, hasOpenwaLinkedAccounts, refetch]);

  const openStatusDialog = useCallback(() => {
    setShowOpenwaDialog(true);
  }, []);

  useEffect(() => {
    if (!autoOpenOnMount) return;
    if (hasPromptedOpenwaRef.current) return;
    if (hasAutoPromptedThisSession()) return;
    if (!isMessagingReady || !hasOpenwaLinkedAccounts) return;

    hasPromptedOpenwaRef.current = true;
    markAutoPromptedThisSession();

    void (async () => {
      const result = await fetchStatus();
      const status = result?.data;
      if (status?.allConnected) return;
      setShowOpenwaDialog(true);
    })();
  }, [autoOpenOnMount, fetchStatus, hasOpenwaLinkedAccounts, isMessagingReady]);

  return {
    showOpenwaDialog,
    setShowOpenwaDialog,
    openStatusDialog,
    fetchStatus,
    openwaStatusQuery,
    openwaProfileAccounts,
    hasOpenwaLinkedAccounts,
  };
}
