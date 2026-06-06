"use client";

import { useI18n } from "@/hooks/useI18n";
import { getPlatformLabelKey } from "@/lib/whatsapp-messaging-provider";

const agentSelectCls =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white";

/**
 * Platform picker shown when a client has more than one linked WhatsApp account.
 */
export default function WhatsappPlatformSelect({
  accounts = [],
  value,
  onChange,
  id = "whatsapp_send_platform",
  className = "",
  required = false,
  error,
}) {
  const { translate } = useI18n();

  if (!accounts || accounts.length <= 1) {
    return null;
  }

  const platformDefaults = {
    openwa: "OpenWA",
    whatsapp: "WhatsApp Cloud API",
    ultramessage: "UltraMessage",
  };

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
        aria-invalid={Boolean(error)}
      >
        <option value="">
          {translate("whatsappSend.selectPlatformPlaceholder", "Choose an account…")}
        </option>
        {accounts.map((account) => {
          const labelKey = getPlatformLabelKey(account.platform);
          const platformName = translate(
            labelKey,
            platformDefaults[account.platform] ?? account.platform
          );
          const phone = account.whatsapp_number ? ` (${account.whatsapp_number})` : "";
          return (
            <option key={account.platform} value={account.platform}>
              {platformName}
              {phone}
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
