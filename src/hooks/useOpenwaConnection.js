"use client";

import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { useOpenwaSessionsStatus } from "@/hooks/useOpenwaSessionsStatus";
import {
  isOpenwaProvider,
  resolveSenderPhoneNumber,
} from "@/lib/whatsapp-messaging-provider";
import { useEffect, useMemo, useRef, useState } from "react";

export function useOpenwaConnection({
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

  const openwaStatusQuery = useOpenwaSessionsStatus({
    enabled: hasOpenwaLinkedAccounts,
    pollWhileDisconnected: showOpenwaDialog,
  });

  useEffect(() => {
    if (!autoOpenOnMount) return;
    if (hasPromptedOpenwaRef.current) return;
    if (!isMessagingReady) return;

    hasPromptedOpenwaRef.current = true;
    if (hasOpenwaLinkedAccounts) {
      setShowOpenwaDialog(true);
    }
  }, [autoOpenOnMount, hasOpenwaLinkedAccounts, isMessagingReady]);

  return {
    showOpenwaDialog,
    setShowOpenwaDialog,
    openwaStatusQuery,
    openwaProfileAccounts,
    hasOpenwaLinkedAccounts,
  };
}
