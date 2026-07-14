"use client";

import { useI18n } from "@/hooks/useI18n";
import { getWhatsappAccountRestrictionMessage } from "@/lib/whatsapp-account-restriction";

/**
 * Shown when a restricted role has no matching linked WhatsApp account.
 */
export default function WhatsappRestrictionNotice({
  code,
  className = "",
}) {
  const { translate } = useI18n();
  if (!code) return null;

  return (
    <p className={`text-xs text-red-600 ${className}`.trim()} role="alert">
      {getWhatsappAccountRestrictionMessage(code, translate)}
    </p>
  );
}
