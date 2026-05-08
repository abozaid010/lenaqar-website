"use client";

import { useI18n } from "@/context/translate-api";
import { SELECTION_COLORS } from "@/constants/colors";
import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import { Phone } from "lucide-react";

export default function LeadRow({ user, selected, onSelect }) {
  const { t } = useI18n();

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(user)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(user);
        }
      }}
      className={`w-full flex flex-row items-center gap-3 text-start px-4 py-3 border-b border-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        selected ? SELECTION_COLORS.SELECTED : "hover:bg-gray-50 bg-white"
      }`}
    >
      {/* Name */}
      <span className="font-semibold text-sm leading-snug text-gray-900 truncate min-w-0 flex-1">
        {user.name || t.clientsTable?.newLead || "Lead"}
      </span>

      {/* Phone */}
      <span className="text-sm leading-snug text-gray-700 font-mono tabular-nums truncate min-w-0 shrink-0">
        {user.phone_number || "—"}
      </span>

      {/* Quick Actions */}
      {user.phone_number ? (
        <div className="flex items-center gap-0.5 shrink-0">
          <a
            href={`tel:${user.phone_number}`}
            onClick={(e) => e.stopPropagation()}
            className={`${DASHBOARD_ICON_BUTTON} hover:text-primary`}
            title="Make a call"
            aria-label="Call"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
          </a>

          <WhatsAppButton
            phoneNumber={user.phone_number}
            className="hover:text-green-600"
            title={t.clientsTable?.openWhatsApp || "Open WhatsApp"}
            ariaLabel="WhatsApp"
          />
        </div>
      ) : null}
    </div>
  );
}
