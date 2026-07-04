"use client";

import { MessageCircle, PhoneCall, RefreshCw } from "lucide-react";
import type { MouseEvent } from "react";
import { formatPhoneForDisplay } from "@/components/phone/phone-utils";

export interface UnitInquiryContactHeaderActions {
  onCall?: () => void;
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
  const displayPhone = phone?.trim()
    ? formatPhoneForDisplay(phone, "EG") || phone.trim()
    : null;

  if (!displayName && !displayPhone) {
    return null;
  }

  const showActions = Boolean(
    actions?.onCall || actions?.onWhatsApp || actions?.onRefresh
  );

  return (
    <div
      className={`shrink-0 flex items-start justify-between gap-2 border-b border-gray-100 pb-3 ${className}`.trim()}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        {displayName ? (
          <p className="text-sm font-semibold text-gray-900 truncate">
            {displayName}
          </p>
        ) : null}
        {displayPhone ? (
          <p className="text-xs text-gray-600" dir="ltr">
            {displayPhone}
          </p>
        ) : null}
      </div>

      {showActions ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {actions?.onCall ? (
            <button
              type="button"
              onClick={actions.onCall}
              disabled={actions.callDisabled}
              aria-label={actions.callLabel}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
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
