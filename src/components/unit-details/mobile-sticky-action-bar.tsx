'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import { formatPhoneForDisplay } from '@/components/phone/phone-utils';
import CallButton from '@/components/ui/call-button';
import WhatsAppButton from '@/components/ui/whatsapp-button';
import { resolveOwnerFromDashboardPhone } from '@/lib/units/resolve-owner-from-dashboard';
import type { MobileStickyActionBarProps } from '@/lib/units/unit-types';
import { normalizeConversationPhone } from '@/utils/normalize-conversation-phone';

export default function MobileStickyActionBar({
  unit,
  isOwnUnit: isOwnUnitProp,
}: MobileStickyActionBarProps) {
  const { translate, locale } = useI18n();
  const { isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);
  const isOwnUnit = Boolean(isOwnUnitProp) || isOwnUnitFromHook;

  const ownerMobile = unit.ownerMobile?.trim() || null;
  const [ownerName, setOwnerName] = useState<string | null>(
    unit.ownerName?.trim() || null
  );

  useEffect(() => {
    const initialName = unit.ownerName?.trim() || null;
    setOwnerName(initialName);

    if (!isOwnUnit || initialName || !ownerMobile) return;

    let cancelled = false;
    (async () => {
      const resolved = await resolveOwnerFromDashboardPhone(ownerMobile);
      if (!cancelled && resolved?.name) {
        setOwnerName(resolved.name);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOwnUnit, ownerMobile, unit.ownerName]);

  // Same-client units expose owner details directly; hide when unavailable.
  if (!isOwnUnit || (!ownerName && !ownerMobile)) {
    return null;
  }

  const displayPhone = ownerMobile
    ? formatPhoneForDisplay(ownerMobile, 'EG') || ownerMobile
    : null;
  const whatsappPhone = ownerMobile
    ? normalizeConversationPhone(ownerMobile) || ownerMobile
    : null;

  const callLabel = translate(
    'buttons.call',
    locale === 'ar' ? 'اتصال' : 'Call'
  );
  const whatsappLabel = translate(
    'buttons.whatsapp',
    locale === 'ar' ? 'واتساب' : 'WhatsApp'
  );
  const ownerLabel = translate(
    'unitInquiry.owner',
    locale === 'ar' ? 'المالك' : 'Owner'
  );

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-50">
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 truncate">{ownerLabel}</p>
            {ownerName ? (
              <p className="text-sm font-semibold text-gray-900 truncate">
                {ownerName}
              </p>
            ) : null}
            {displayPhone ? (
              <p
                className={`truncate ${ownerName ? 'text-xs text-gray-600 mt-0.5' : 'text-sm font-semibold text-gray-900'}`}
                dir="ltr"
              >
                {displayPhone}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ownerMobile ? (
              <CallButton
                phoneNumber={ownerMobile}
                ariaLabel={callLabel}
                title={callLabel}
                className="!bg-primary !text-white !border-primary hover:!opacity-95 !h-11 !w-11 !min-h-11 !min-w-11"
              />
            ) : null}
            {whatsappPhone ? (
              <WhatsAppButton
                phoneNumber={whatsappPhone}
                ariaLabel={whatsappLabel}
                title={whatsappLabel}
                className="!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 !h-11 !w-11 !min-h-11 !min-w-11"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
