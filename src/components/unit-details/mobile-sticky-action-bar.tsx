'use client';

import { useEffect, useState } from 'react';
import EditUserInfoDialog from '@/app/(admin)/dashboard/_components/split-view/EditUserInfoDialog';
import {
  formatPhoneForDisplay,
  maskPhoneForDisplay,
} from '@/components/phone/phone-utils';
import { EditButton } from '@/components/ui/action-button';
import AddLeadDialog from '@/components/ui/add-lead-dialog';
import CallButton from '@/components/ui/call-button';
import WhatsAppButton from '@/components/ui/whatsapp-button';
import { useI18n } from '@/hooks/useI18n';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import { resolveOwnerFromDashboardPhone } from '@/lib/units/resolve-owner-from-dashboard';
import type { MobileStickyActionBarProps } from '@/lib/units/unit-types';
import { normalizeConversationPhone } from '@/utils/normalize-conversation-phone';

type OwnerContact = {
  name: string | null;
  phone: string | null;
  userId: string | null;
  ownerType: string | null;
};

function stripBrokerPrefix(name: string | null): string {
  if (!name) return '';
  return name.replace(/^broker:\s*/i, '').trim();
}

export default function MobileStickyActionBar({
  unit,
  isOwnUnit: isOwnUnitProp,
}: MobileStickyActionBarProps) {
  const { translate, locale } = useI18n();
  const { myClientId, isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);
  const isOwnUnit = Boolean(isOwnUnitProp) || isOwnUnitFromHook;

  const [contact, setContact] = useState<OwnerContact>({
    name: unit.ownerName?.trim() || null,
    phone: unit.ownerMobile?.trim() || null,
    userId: null,
    ownerType: null,
  });
  const [ownerLookupDone, setOwnerLookupDone] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  useEffect(() => {
    const phone = unit.ownerMobile?.trim() || null;
    const name = unit.ownerName?.trim() || null;

    setContact({
      name,
      phone,
      userId: null,
      ownerType: null,
    });
    setOwnerLookupDone(false);

    if (!isOwnUnit || !phone) {
      setOwnerLookupDone(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const resolved = await resolveOwnerFromDashboardPhone(phone);
      if (cancelled) return;

      if (resolved) {
        setContact((prev) => ({
          name: prev.name || resolved.name || null,
          phone: prev.phone,
          userId: resolved.userId,
          ownerType: resolved.ownerType,
        }));
      }
      setOwnerLookupDone(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOwnUnit, unit.ownerMobile, unit.ownerName]);

  if (!isOwnUnit || (!contact.name && !contact.phone)) {
    return null;
  }

  const displayPhone = contact.phone
    ? maskPhoneForDisplay(
        formatPhoneForDisplay(contact.phone, 'EG') || contact.phone
      )
    : null;
  const whatsappPhone = contact.phone
    ? normalizeConversationPhone(contact.phone) || contact.phone
    : null;

  const callLabel = translate(
    'buttons.call',
    locale === 'ar' ? 'اتصال' : 'Call'
  );
  const whatsappLabel = translate(
    'buttons.whatsapp',
    locale === 'ar' ? 'واتساب' : 'WhatsApp'
  );
  const editLabel = translate(
    'buttons.edit',
    locale === 'ar' ? 'تعديل' : 'Edit'
  );
  const addLeadLabel = translate(
    'dashboardFilter.ADD',
    locale === 'ar' ? 'إضافة' : 'Add'
  );

  const handleContactActionClick = () => {
    if (!ownerLookupDone) return;
    if (contact.userId) {
      setEditOpen(true);
      return;
    }
    setAddLeadOpen(true);
  };

  const handleContactUpdated = (
    updatedLead: Record<string, unknown> | null,
    _response: unknown,
    submittedPayload?: Record<string, unknown>
  ) => {
    const source = updatedLead || submittedPayload || {};
    setContact((prev) => ({
      ...prev,
      name:
        typeof source.name === 'string' && source.name.trim()
          ? source.name.trim()
          : prev.name,
      phone:
        typeof source.phone_number === 'string' && source.phone_number.trim()
          ? source.phone_number.trim()
          : prev.phone,
      ownerType:
        typeof source.owner_type === 'string'
          ? source.owner_type
          : prev.ownerType,
    }));
  };

  const handleLeadAdded = (data?: Record<string, unknown> | null) => {
    if (!data || typeof data !== 'object') return;
    setContact((prev) => ({
      ...prev,
      name:
        typeof data.user_name === 'string' && data.user_name.trim()
          ? data.user_name.trim()
          : prev.name,
      phone:
        typeof data.phone_number === 'string' && data.phone_number.trim()
          ? data.phone_number.trim()
          : prev.phone,
      userId:
        data.user_id != null && String(data.user_id).trim()
          ? String(data.user_id)
          : prev.userId,
      ownerType:
        typeof data.owner_type === 'string'
          ? data.owner_type
          : prev.ownerType,
    }));
  };

  const actionLabel = contact.userId || !ownerLookupDone ? editLabel : addLeadLabel;

  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-50">
        <div className="flex items-center gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            {contact.name ? (
              <p className="text-sm font-semibold text-gray-900 truncate">
                {contact.name}
              </p>
            ) : null}
            {displayPhone ? (
              <p
                className={`truncate ${contact.name ? 'text-xs text-gray-600' : 'text-sm font-semibold text-gray-900'}`}
                dir="ltr"
              >
                {displayPhone}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {contact.phone ? (
              <CallButton
                phoneNumber={contact.phone}
                ariaLabel={callLabel}
                title={callLabel}
              />
            ) : null}
            {whatsappPhone ? (
              <WhatsAppButton
                phoneNumber={whatsappPhone}
                ariaLabel={whatsappLabel}
                title={whatsappLabel}
              />
            ) : null}
            <EditButton
              size="lg"
              title={actionLabel}
              ariaLabel={actionLabel}
              disabled={!ownerLookupDone}
              onClick={handleContactActionClick}
            />
          </div>
        </div>
      </div>

      {contact.userId ? (
        <EditUserInfoDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          userId={contact.userId}
          initialName={stripBrokerPrefix(contact.name)}
          initialPhone={contact.phone || ''}
          initialOwnerType={contact.ownerType}
          onSuccess={handleContactUpdated}
        />
      ) : null}

      <AddLeadDialog
        isOpen={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        clientId={myClientId}
        initialName={stripBrokerPrefix(contact.name)}
        initialPhone={contact.phone || ''}
        onSuccess={handleLeadAdded}
      />
    </>
  );
}
