"use client";

import { formatPhoneForDisplay } from "@/components/phone/phone-utils";

export interface UnitInquiryContactHeaderProps {
  name?: string | null;
  phone?: string | null;
  className?: string;
}

export default function UnitInquiryContactHeader({
  name,
  phone,
  className = "",
}: UnitInquiryContactHeaderProps) {
  const displayName = name?.trim() || null;
  const displayPhone = phone?.trim()
    ? formatPhoneForDisplay(phone, "EG") || phone.trim()
    : null;

  if (!displayName && !displayPhone) {
    return null;
  }

  return (
    <div
      className={`shrink-0 space-y-0.5 border-b border-gray-100 pb-3 ${className}`.trim()}
    >
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
  );
}
