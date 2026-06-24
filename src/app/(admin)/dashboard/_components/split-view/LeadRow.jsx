"use client";

import { useI18n } from "@/hooks/useI18n";
import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import { Phone } from "lucide-react";
import { formatPhoneForDisplay, phoneToE164 } from "@/components/phone/phone-utils";
import {
  getOwnerTypeLabel,
  normalizeOwnerType,
} from "@/constants/owner-type";

export default function LeadRow({
  user,
  selected,
  onSelect,
  bulkSelected = false,
  onToggleBulkSelection,
  showBulkCheckbox = false,
}) {
  const { t, translate } = useI18n();
  const rawPhone = user.phone_number;
  const phoneE164 = phoneToE164(rawPhone, "EG") || rawPhone;
  const phoneDisplay =
    (rawPhone && (formatPhoneForDisplay(rawPhone, "EG") || rawPhone)) || "—";
  const ownerType = normalizeOwnerType(user.owner_type);
  const ownerTypeLabel = ownerType ? getOwnerTypeLabel(ownerType, translate) : "";

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
      className={`w-full flex flex-row items-center gap-2 text-start px-3 py-2 chat-list-row transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366]/30 ${
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

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-sm leading-tight text-chat-text truncate">
            {user.name || t.clientsTable?.newLead || "Lead"}
          </span>
          {ownerTypeLabel ? (
            <span
              className={`shrink-0 inline-flex items-center rounded px-0.5 py-0 font-normal leading-none ${
                ownerType === "broker"
                  ? "bg-amber-50 text-amber-700"
                  : ownerType === "developer"
                    ? "bg-purple-50 text-purple-700"
                    : "bg-sky-50 text-sky-700"
              }`}
              style={{ fontSize: "8px", lineHeight: "10px" }}
            >
              {ownerTypeLabel}
            </span>
          ) : null}
        </div>

        <span
          dir="ltr"
          className="text-xs leading-tight text-chat-text-muted font-mono tabular-nums truncate text-start"
        >
          {phoneDisplay}
        </span>
      </div>

      {rawPhone ? (
        <a
          href={`tel:${phoneE164 || rawPhone}`}
          onClick={(e) => e.stopPropagation()}
          className={`${DASHBOARD_ICON_BUTTON} shrink-0 hover:text-primary`}
          title="Make a call"
          aria-label="Call"
        >
          <Phone className="w-3.5 h-3.5" strokeWidth={2} />
        </a>
      ) : null}
    </div>
  );
}
