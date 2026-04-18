"use client";

import { useI18n } from "@/context/translate-api";
import { SELECTION_COLORS } from "@/constants/colors";
import { getBuildingTypes } from "@/data/constants";
import { ACTIONS_COLORS, getActionLabel } from "@/utils/actions";
import { formatDateTimeAmPmShort } from "@/utils/formateDate";
import en from "../../../../../../public/locales/en";
import ar from "../../../../../../public/locales/ar";
import { DASHBOARD_CONTROL_BASE, DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import { Phone } from "lucide-react";
import { useMemo } from "react";

export default function LeadRow({ user, selected, onSelect }) {
  const { t, locale } = useI18n();

  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  let lastActivity = t.clientsTable?.lastActivity?.na ?? "—";
  try {
    const formatted = formatDateTimeAmPmShort(user.updated_at);
    if (formatted) lastActivity = formatted;
  } catch {
    /* ignore */
  }

  const requirementLabel =
    user.requirement_name &&
    user.requirement_name !== "Not defined" &&
    (BUILDING_TYPES.find((type) => type.value === user.requirement_name)?.[
      locale === "ar" ? "ar_label" : "en_label"
    ] || user.requirement_name);

  const actionLabel = getActionLabel(user.last_action || null, locale);

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
      className={`w-full flex flex-col items-start gap-y-2.5 text-start px-4 py-4 border-b border-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        selected ? SELECTION_COLORS.SELECTED : "hover:bg-gray-50 bg-white"
      }`}
    >
      {/* Row 1: Name | Requirement | Date */}
      <div className="flex flex-row items-center justify-start gap-x-3 w-full min-w-0">
        <span className="font-semibold text-sm leading-snug text-gray-900 truncate min-w-0">
          {user.name || t.clientsTable?.newLead || "Lead"}
        </span>

        {requirementLabel && (
          <span className="inline-flex items-center text-xs leading-snug px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0 whitespace-nowrap">
            {requirementLabel}
          </span>
        )}

        <span className="text-xs leading-snug text-gray-500 whitespace-nowrap shrink-0">
          {lastActivity}
        </span>
      </div>

      {/* Row 2: Phone | Call | WhatsApp | Action */}
      <div className="flex flex-row items-center justify-start gap-2 w-full min-w-0">
        <span className="text-sm leading-snug text-gray-700 font-mono tabular-nums truncate min-w-0 shrink-0">
          {user.phone_number || "—"}
        </span>

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

        <span
          className={`shrink-0 inline-flex items-center h-8 px-2.5 text-xs leading-snug font-semibold ${DASHBOARD_CONTROL_BASE} bg-gray-50 hover:bg-gray-50 ${
            ACTIONS_COLORS[user.last_action] ? ACTIONS_COLORS[user.last_action] : "text-gray-600"
          }`}
          title={actionLabel}
        >
          {actionLabel}
        </span>
      </div>
    </div>
  );
}
