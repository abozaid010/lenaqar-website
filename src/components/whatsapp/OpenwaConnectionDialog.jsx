"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import { isOpenwaSessionTerminalFailure } from "@/lib/openwa-session-status";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

function formatDisplayPhone(phone) {
  if (!phone) return "";
  const raw = String(phone).trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+${raw}`;
}

function SessionStatusCard({
  session,
  translate,
  isRefreshing,
  hasStatusData,
  onReconnect,
}) {
  const phone = formatDisplayPhone(session.whatsapp_number);
  const connectedLabel = translate(
    "openwaConnection.connected",
    "Connected"
  );
  const scanLabel = translate(
    "openwaConnection.scanQr",
    "Scan this QR code with WhatsApp on your phone"
  );
  const errorLabel = translate(
    "openwaConnection.sessionError",
    "Could not load connection status for this number"
  );
  const loadingQrLabel = translate(
    "openwaConnection.loadingQr",
    "Loading QR…"
  );
  const waitingQrLabel = translate(
    "openwaConnection.waitingForQr",
    "Waiting for QR code…"
  );
  const reconnectLabel = translate(
    "openwaConnection.reconnect",
    "Reconnect"
  );
  const reconnectHint = translate(
    "openwaConnection.reconnectHint",
    "Connection failed. Try again to request a new QR code."
  );

  const isTerminalFailure = isOpenwaSessionTerminalFailure(session);
  const isInitializing =
    !session.connected &&
    !session.qrImage &&
    !session.error &&
    !isTerminalFailure &&
    isRefreshing &&
    !hasStatusData;
  const qrPendingFromBackend = Boolean(session.qrPendingFromBackend);
  const qrPendingHint = translate(
    "openwaConnection.qrPendingFromBackend",
    "OpenWA reports {status} but has not returned a QR image yet. We will keep checking automatically."
  ).replace("{status}", session.status || "pending");

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900" dir="ltr">
            {phone || translate("openwaConnection.unknownNumber", "WhatsApp number")}
          </p>
          {session.status ? (
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {session.status.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
        {session.connected ? (
          <span className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            {connectedLabel}
          </span>
        ) : null}
      </div>

      {session.error && !isTerminalFailure ? (
        <p className="text-sm text-red-600">{session.error || errorLabel}</p>
      ) : null}

      {isTerminalFailure ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600">
            {session.error || errorLabel}
          </p>
          <p className="text-xs text-gray-600">{reconnectHint}</p>
          <button
            type="button"
            onClick={onReconnect}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            {reconnectLabel}
          </button>
        </div>
      ) : null}

      {!session.connected && session.qrImage ? (
        <div className="flex flex-col items-center gap-2">
          <img
            src={session.qrImage}
            alt={scanLabel}
            width={240}
            height={240}
            className="rounded-md border border-gray-200 bg-white p-2"
          />
          <p className="text-sm text-gray-600 text-center">{scanLabel}</p>
        </div>
      ) : null}

      {!session.connected &&
      !session.qrImage &&
      !session.error &&
      !isTerminalFailure ? (
        isInitializing ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" aria-hidden />
            <span>{loadingQrLabel}</span>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{waitingQrLabel}</p>
            {qrPendingFromBackend ? (
              <p className="text-xs text-amber-700">{qrPendingHint}</p>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}

export default function OpenwaConnectionDialog({
  isOpen,
  onClose,
  statusQuery,
  fallbackSessions = [],
  autoCloseWhenConnected = false,
}) {
  const { translate } = useI18n();
  const { data, isLoading, isFetching, isError, refetch, error } = statusQuery;

  const hasStatusData = Boolean(data?.sessions?.length);
  const sessions = hasStatusData ? data.sessions : fallbackSessions;
  const allConnected = hasStatusData ? Boolean(data?.allConnected) : false;
  const disconnectedCount = useMemo(
    () => sessions.filter((session) => !session.connected).length,
    [sessions]
  );

  // UX: Only show this dialog when something isn't working.
  // If everything is connected, auto-hide immediately (no success modal).
  const shouldSuppressDialog =
    isOpen &&
    !isLoading &&
    hasStatusData &&
    Boolean(data?.allConnected) &&
    data.sessions.every((session) => session.connected);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!shouldSuppressDialog) return;
    // Defer to next tick so parent state updates safely.
    const timer = window.setTimeout(() => {
      onCloseRef.current();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [shouldSuppressDialog]);

  const title = allConnected
    ? translate("openwaConnection.titleConnected", "WhatsApp is connected")
    : translate("openwaConnection.title", "Connect WhatsApp");

  const description = allConnected
    ? translate(
        "openwaConnection.allConnectedDescription",
        "All linked WhatsApp numbers are connected and ready."
      )
    : translate(
        "openwaConnection.disconnectedDescription",
        "Scan the QR code for each number below to restore WhatsApp messaging."
      );

  const networkErrorMessage =
    error instanceof Error
      ? error.message
      : translate(
          "openwaConnection.networkError",
          "Could not refresh connection status. Retrying automatically…"
        );

  if (shouldSuppressDialog) return null;

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      cancelLabel={translate("buttons.close", "Close")}
      onCancel={onClose}
      headerTrailing={
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm font-medium disabled:opacity-70"
          aria-label={translate("openwaConnection.refresh", "Refresh status")}
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            aria-hidden
          />
          {translate("openwaConnection.refresh", "Refresh")}
        </button>
      }
      dialogClassName="max-w-lg"
      bodyClassName="space-y-4"
    >
      {isLoading && sessions.length === 0 ? (
        <LoadingSpinner
          message={translate("openwaConnection.loading", "Checking WhatsApp connections…")}
          containerClassName="flex items-center justify-center min-h-[160px]"
        />
      ) : isError && sessions.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">
            {translate(
              "openwaConnection.loadFailed",
              "Could not check WhatsApp connection status. Please try again."
            )}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5"
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            {translate("openwaConnection.reconnect", "Reconnect")}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">{description}</p>

          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionStatusCard
                key={session.session_id}
                session={session}
                translate={translate}
                isRefreshing={isFetching}
                hasStatusData={hasStatusData}
                onReconnect={() => refetch()}
              />
            ))}
          </div>

          {isError && sessions.length > 0 ? (
            <p className="text-sm text-amber-700">
              {networkErrorMessage ||
                translate(
                  "openwaConnection.partialLoadFailed",
                  "Some connection details could not be refreshed. Try again."
                )}
            </p>
          ) : null}

          {!allConnected && disconnectedCount > 0 && isOpen ? (
            <p className="text-xs text-gray-500">
              {translate(
                "openwaConnection.pollingHint",
                "Status updates automatically every 15 seconds while this dialog is open."
              )}
            </p>
          ) : null}
        </>
      )}
    </UnifiedDialog>
  );
}
