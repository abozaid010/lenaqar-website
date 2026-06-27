"use client";

import OpenwaConnectionDialog from "@/components/whatsapp/OpenwaConnectionDialog";
import { useI18n } from "@/hooks/useI18n";
import { useOpenwaConnection } from "@/hooks/useOpenwaConnection";
import { MessageCircle } from "lucide-react";

/**
 * @param {{
 *   autoOpenOnMount?: boolean;
 *   showButton?: boolean;
 *   buttonVariant?: "card" | "inline";
 *   autoCloseWhenConnected?: boolean;
 * }} props
 */
export default function OpenwaConnectionAccess({
  autoOpenOnMount = false,
  showButton = false,
  buttonVariant = "card",
  autoCloseWhenConnected = false,
}) {
  const { translate } = useI18n();
  const {
    showOpenwaDialog,
    setShowOpenwaDialog,
    openStatusDialog,
    openwaStatusQuery,
    openwaProfileAccounts,
    hasOpenwaLinkedAccounts,
  } = useOpenwaConnection({ autoOpenOnMount });

  const openwaStatusLabel = translate(
    "openwaConnection.openStatus",
    "WhatsApp connection"
  );
  const openwaStatusDescription = translate(
    "openwaConnection.settingsDescription",
    "Check whether your linked WhatsApp numbers are connected or scan a QR code to reconnect."
  );

  if (!hasOpenwaLinkedAccounts) {
    return null;
  }

  return (
    <>
      {showButton && buttonVariant === "card" ? (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {openwaStatusLabel}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {openwaStatusDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={openStatusDialog}
              className="shrink-0 inline-flex items-center justify-center gap-2 py-2 px-4 border border-primary/30 text-primary rounded-md text-sm font-medium transition-colors hover:bg-primary/5"
              aria-label={openwaStatusLabel}
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>{openwaStatusLabel}</span>
            </button>
          </div>
        </div>
      ) : null}

      {showButton && buttonVariant === "inline" ? (
        <button
          type="button"
          onClick={openStatusDialog}
          className="no-print inline-flex items-center justify-center gap-1.5 h-9 min-h-9 px-3 rounded-md border border-primary/20 bg-white text-sm font-medium text-primary shadow-sm hover:bg-primary/5 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          aria-label={openwaStatusLabel}
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
          <span>{openwaStatusLabel}</span>
        </button>
      ) : null}

      <OpenwaConnectionDialog
        isOpen={showOpenwaDialog}
        onClose={() => setShowOpenwaDialog(false)}
        statusQuery={openwaStatusQuery}
        fallbackSessions={openwaProfileAccounts}
        autoCloseWhenConnected={autoCloseWhenConnected}
      />
    </>
  );
}
