"use client";

import { useI18n } from "@/context/translate-api";
import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import { Phone } from "lucide-react";
import { formatPhoneForDisplay, phoneToE164 } from "@/components/phone/phone-utils";

export default function LeadRow({
  user,
  selected,
  onSelect,
  bulkSelected = false,
  onToggleBulkSelection,
  showBulkCheckbox = false,
}) {
  const { t } = useI18n();
  const rawPhone = user.phone_number;
  const phoneE164 = phoneToE164(rawPhone, "EG") || rawPhone;
  const phoneDisplay =
    (rawPhone && (formatPhoneForDisplay(rawPhone, "EG") || rawPhone)) || "—";

  return (
    <div
      role="option"
      aria-selected={selected}
      data-user-id={user.user_id}
      onClick={() => onSelect(user)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(user);
        }
      }}
      className={`w-full flex flex-row items-center gap-3 text-start px-4 py-3 chat-list-row transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366]/30 ${
        selected ? "chat-list-row--selected" : ""
      }`}
    >
      {showBulkCheckbox && (
        <input
          type="checkbox"
          checked={bulkSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleBulkSelection?.(user.user_id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
          aria-label={t.clientsTable?.headers?.name || "Select lead"}
        />
      )}

      {/* Name */}
      <span className="font-semibold text-sm leading-snug text-chat-text truncate min-w-0 flex-1">
        {user.name || t.clientsTable?.newLead || "Lead"}
      </span>

      {/* Phone */}
      <span className="text-sm leading-snug text-chat-text-muted font-mono tabular-nums truncate min-w-0 shrink-0">
        {phoneDisplay}
      </span>

      {/* Quick Actions */}
      {rawPhone ? (
        <div className="flex items-center gap-0.5 shrink-0">
          <a
            href={`tel:${phoneE164 || rawPhone}`}
            onClick={(e) => e.stopPropagation()}
            className={`${DASHBOARD_ICON_BUTTON} hover:text-primary`}
            title="Make a call"
            aria-label="Call"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
          </a>

          <WhatsAppButton
            phoneNumber={phoneE164 || rawPhone}
            className="hover:text-green-600"
            title={t.clientsTable?.openWhatsApp || "Open WhatsApp"}
            ariaLabel="WhatsApp"
          />
        </div>
      ) : null}
    </div>
  );
}
