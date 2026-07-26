"use client";

import { MessageCircle, RefreshCw } from "lucide-react";
import type { MouseEvent } from "react";
import { formatPhoneForDisplay } from "@/components/phone/phone-utils";
import CallButton from "@/components/ui/call-button";

export interface UnitInquiryContactHeaderActions {
  onWhatsApp?: (event: MouseEvent<HTMLButtonElement>) => void;
  onRefresh?: () => void;
  callDisabled?: boolean;
  whatsappDisabled?: boolean;
  refreshDisabled?: boolean;
  refreshLoading?: boolean;
  callLabel?: string;
  whatsappLabel?: string;
  refreshLabel?: string;
}

export interface UnitInquiryContactHeaderProps {
  name?: string | null;
  phone?: string | null;
  actions?: UnitInquiryContactHeaderActions;
  className?: string;
}

export default function UnitInquiryContactHeader({
  name,
  phone,
  actions,
  className = "",
}: UnitInquiryContactHeaderProps) {
  const displayName = name?.trim() || null;
  const rawPhone = phone?.trim() || null;
  const displayPhone = rawPhone
    ? formatPhoneForDisplay(rawPhone, "EG") || rawPhone
    : null;

  // Prefer name when both exist; fall back to phone when name is missing.
  const label = displayName || displayPhone;

  if (!label) {
    return null;
  }

  // Copy/call always use the phone number, even when the label shows the name.
  const showCall = Boolean(rawPhone) && !actions?.callDisabled;
  const showActions = Boolean(
    showCall || actions?.onWhatsApp || actions?.onRefresh
  );

  return (
    <div
      className={`shrink-0 flex items-start justify-between gap-2 border-b border-gray-100 pb-3 ${className}`.trim()}
    >
      <div className="min-w-0 flex-1">
        <p
          className={
            displayName
              ? "text-sm font-semibold text-gray-900 truncate"
              : "text-xs text-gray-600"
          }
          dir={displayName ? undefined : "ltr"}
        >
          {label}
        </p>
      </div>

      {showActions ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {showCall ? (
            <CallButton
              phoneNumber={rawPhone}
              showCopy
              ariaLabel={actions?.callLabel}
              title={actions?.callLabel}
              className="!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700"
            />
          ) : null}
          {actions?.onWhatsApp ? (
            <button
              type="button"
              onClick={actions.onWhatsApp}
              disabled={actions.whatsappDisabled}
              aria-label={actions.whatsappLabel}
              className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          ) : null}
          {actions?.onRefresh ? (
            <button
              type="button"
              onClick={actions.onRefresh}
              disabled={actions.refreshDisabled}
              aria-label={actions.refreshLabel}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${actions.refreshLoading ? "animate-spin" : ""}`}
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
