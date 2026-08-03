"use client";

import { useI18n } from "@/hooks/useI18n";
import { getWhatsappAccountKey } from "@/lib/whatsapp-messaging-provider";

const agentSelectCls =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white";

/**
 * Platform picker for linked WhatsApp accounts.
 * Empty selection = send via WhatsApp Web (wa.me deep link).
 * Pass `locked` for restricted team roles so the control is hidden.
 */
export default function WhatsappPlatformSelect({
  accounts = [],
  hasMultipleAccounts = false,
  value,
  onChange,
  id = "whatsapp_send_platform",
  className = "",
  required = false,
  error,
  locked = false,
  disabled = false,
}) {
  const { translate } = useI18n();

  // Restricted roles: hide switching UI entirely (auto-selected / blocked upstream).
  if (locked) {
    return null;
  }

  const list = Array.isArray(accounts) ? accounts : [];
  // Show whenever there is at least one linked account (incl. single Cloud API)
  // so the user can opt into API send vs WhatsApp Web.
  if (list.length < 1 && !hasMultipleAccounts) {
    return null;
  }
  if (list.length < 1) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-gray-600">
        {translate("whatsappSend.selectPlatform", "Send from account")}
        {required ? " *" : ""}
      </label>
      <select
        id={id}
        name={id}
        className={agentSelectCls}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
      >
        <option value="">
          {translate(
            "whatsappSend.whatsappWebOption",
            "WhatsApp Web (manual)",
          )}
        </option>
        {list.map((account) => {
          const accountKey = getWhatsappAccountKey(account);
          const phone = account.whatsapp_number?.trim() || "";
          return (
            <option key={accountKey} value={accountKey}>
              {phone ||
                translate("whatsappSend.unknownAccount", "Unknown account")}
            </option>
          );
        })}
      </select>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-gray-500">
          {translate(
            "whatsappSend.webOrAccountHint",
            "Leave empty to open WhatsApp Web and send manually. Choose an account to send via automation.",
          )}
        </p>
      )}
    </div>
  );
}
