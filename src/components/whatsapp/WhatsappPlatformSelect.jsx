"use client";

import { useI18n } from "@/hooks/useI18n";
import { getWhatsappAccountKey } from "@/lib/whatsapp-messaging-provider";

const agentSelectCls =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white";

/**
 * Platform picker shown when a client has more than one linked WhatsApp account.
 * Pass `locked` for restricted team roles (editor/viewer/marketing) so the
 * control is hidden — selection is forced by useWhatsappSelectedAccount.
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

  if (!hasMultipleAccounts) {
    return null;
  }

  if (!Array.isArray(accounts) || accounts.length <= 1) {
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
          {translate("whatsappSend.selectPlatformPlaceholder", "Choose an account…")}
        </option>
        {accounts.map((account) => {
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
            "whatsappSend.multipleAccountsHint",
            "This client has multiple WhatsApp accounts. Choose which one to send from."
          )}
        </p>
      )}
    </div>
  );
}
