"use client";

import CallButton from "@/components/ui/call-button";
import { useI18n } from "@/hooks/useI18n";
import { formatPhoneForDisplay } from "@/components/phone/phone-utils";
import {
  getOwnerTypeLabel,
  normalizeOwnerType,
} from "@/constants/owner-type";

export default function LeadRow({
  user,
  index,
  selected,
  onSelect,
  onCall,
  bulkSelected = false,
  onToggleBulkSelection,
  showBulkCheckbox = false,
}) {
  const { t, translate } = useI18n();
  const rawPhone = user.phone_number;
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
      className={`w-full flex flex-row items-center gap-2 text-start px-3 py-2.5 chat-list-row transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366]/30 ${
        selected ? "chat-list-row--selected" : ""
      }`}
    >
      {(showBulkCheckbox || index != null) && (
        <div className="shrink-0 w-8 flex flex-col items-center gap-0.5">
          {showBulkCheckbox ? (
            <label
              className="flex items-center justify-center p-2 -m-1 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
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
            </label>
          ) : null}
          {index != null ? (
            <span
              className="text-[10px] leading-none text-chat-text-faint tabular-nums"
              aria-hidden
            >
              {index}.
            </span>
          ) : null}
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-sm leading-tight text-chat-text truncate">
            {user.name || t.clientsTable?.newLead || "Lead"}
          </span>
          {ownerTypeLabel ? (
            <span
              className={`shrink-0 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-normal leading-none ${
                ownerType === "broker"
                  ? "bg-amber-50 text-amber-700"
                  : ownerType === "developer"
                    ? "bg-purple-50 text-purple-700"
                    : "bg-sky-50 text-sky-700"
              }`}
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
        <CallButton
          phoneNumber={rawPhone}
          className="shrink-0 hover:text-primary"
          onClick={onCall ? () => onCall(user) : undefined}
        />
      ) : null}
    </div>
  );
}
