"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useMemo } from "react";

function formatDisplayPhone(phone) {
  if (!phone) return "";
  const raw = String(phone).trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+${raw}`;
}

function SessionStatusCard({ session, translate }) {
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

      {session.error ? (
        <p className="text-sm text-red-600">{session.error || errorLabel}</p>
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

      {!session.connected && !session.qrImage && !session.error ? (
        <p className="text-sm text-gray-600">
          {translate(
            "openwaConnection.waitingForQr",
            "Waiting for QR code…"
          )}
        </p>
      ) : null}
    </div>
  );
}

export default function OpenwaConnectionDialog({
  isOpen,
  onClose,
  statusQuery,
  fallbackSessions = [],
}) {
  const { translate } = useI18n();
  const { data, isLoading, isFetching, isError, refetch } = statusQuery;

  const sessions = data?.sessions?.length ? data.sessions : fallbackSessions;
  const allConnected = data?.sessions?.length
    ? Boolean(data?.allConnected)
    : false;
  const disconnectedCount = useMemo(
    () => sessions.filter((session) => !session.connected).length,
    [sessions]
  );

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
        <p className="text-sm text-red-600">
          {translate(
            "openwaConnection.loadFailed",
            "Could not check WhatsApp connection status. Please try again."
          )}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600">{description}</p>

          {allConnected && sessions.length > 0 ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <CheckCircle2
                className="w-14 h-14 text-green-600"
                aria-hidden
              />
              <p className="text-sm font-medium text-green-700 text-center">
                {translate(
                  "openwaConnection.successMessage",
                  "{count} WhatsApp number(s) connected"
                ).replace("{count}", String(sessions.length))}
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionStatusCard
                key={session.session_id}
                session={session}
                translate={translate}
              />
            ))}
          </div>

          {isError && sessions.length > 0 ? (
            <p className="text-sm text-amber-700">
              {translate(
                "openwaConnection.partialLoadFailed",
                "Some connection details could not be refreshed. Try again."
              )}
            </p>
          ) : null}

          {!allConnected && disconnectedCount > 0 ? (
            <p className="text-xs text-gray-500">
              {translate(
                "openwaConnection.pollingHint",
                "Status updates automatically after you scan."
              )}
            </p>
          ) : null}
        </>
      )}
    </UnifiedDialog>
  );
}
