import { useState, useEffect, useMemo, useCallback, type MouseEvent } from 'react';
import { useI18n } from '@/hooks/useI18n';
import type { ChatTurn } from '@/hooks/useConversation';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';
import { contactInfo } from '@/lib/contact-info';
import { buildPublicUnitShareUrl } from '@/lib/units/unit-share-links';
import ChatConversation from '@/components/chat/chat-conversation';
import ChatImagesToUnit from '@/components/unit-details/chat-images-to-unit';
import UnitInquiryContactHeader from '@/components/unit-details/unit-inquiry-contact-header';
import { UNIT_CONVERSATION_MESSAGE_LIMIT } from '@/constants/conversation-limits';
import { formatPhoneForDisplay } from '@/components/phone/phone-utils';
import { normalizeConversationPhone } from '@/utils/api';
import { handleOpenWhatsApp } from '@/utils/phone-utils';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';

export default function StickyInquiryCard({
  unit,
  rawUnit,
  isOwnUnit: isOwnUnitProp,
}: StickyInquiryCardProps) {
  const { translate, locale } = useI18n();
  const { myClientId: currentClientId, isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);
  const isOwnUnit = isOwnUnitProp ?? isOwnUnitFromHook;
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unitUrl, setUnitUrl] = useState('');
  const [conversationControls, setConversationControls] = useState<{
    refetch: () => Promise<unknown>;
    isFetching: boolean;
  } | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatTurn[]>([]);

  const handleConversationControls = useCallback(
    (controls: { refetch: () => Promise<unknown>; isFetching: boolean }) => {
      setConversationControls(controls);
    },
    []
  );

  const handleConversationMessages = useCallback((messages: ChatTurn[]) => {
    setConversationMessages(messages);
  }, []);

  useEffect(() => {
    const code = unit.referenceCode?.trim();
    setUnitUrl(code ? buildPublicUnitShareUrl(code) : '');
  }, [unit.referenceCode]);

  const receiverPhone = useMemo(
    () =>
      contactData?.whatsapp?.trim() ||
      contactData?.phone?.trim() ||
      unit.ownerMobile?.trim() ||
      '',
    [contactData, unit.ownerMobile]
  );

  const showOwnerContact = Boolean(
    isOwnUnit && (unit.ownerName?.trim() || unit.ownerMobile?.trim())
  );
  const showChatImageActions = isOwnUnit;

  const callLabel = translate(
    "buttons.call",
    locale === "ar" ? "اتصال" : "Call"
  );
  const whatsappLabel = translate(
    "buttons.whatsapp",
    locale === "ar" ? "واتساب" : "WhatsApp"
  );
  const refreshLabel = translate(
    "chatConversation.refreshMessages",
    locale === "ar" ? "تحديث المحادثة" : "Refresh messages"
  );

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        setLoading(true);

        if (showOwnerContact) {
          setContactData({
            name: unit.ownerName?.trim() || null,
            phone: unit.ownerMobile?.trim() || null,
            whatsapp: unit.ownerMobile?.trim() || null,
            type: 'Owner',
          });
          return;
        }

        const contact = await contactInfo.get_contact_info(
          {
            clientId: unit.clientId,
            developerId: unit.developerId,
            isPrimary: unit.isPrimary,
            ownerName: unit.ownerName,
            ownerMobile: unit.ownerMobile,
            developerName: unit.developerName,
          },
          currentClientId
        );

        setContactData(contact);
      } catch (error) {
        console.error('Error loading contact info:', error);
        setContactData({
          name: null,
          phone: null,
          whatsapp: null,
          type: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadContactInfo();
  }, [unit, showOwnerContact, currentClientId]);

  const handleCall = () => {
    if (contactData?.phone) {
      window.open(`tel:${contactData.phone}`, '_blank');
    } else {
      console.log('No phone number available');
    }
  };

  const handleWhatsApp = (event: MouseEvent) => {
    const phone = contactData?.whatsapp || contactData?.phone;
    if (!phone) return;
    handleOpenWhatsApp(
      event as unknown as Event,
      normalizeConversationPhone(phone) || phone
    );
  };

  return (
    <div className="bg-white rounded-lg border shadow-lg p-4 flex flex-col h-full min-h-0 gap-3">
      {loading ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center shrink-0">
          <div className="text-xs text-gray-600">
            {translate("unitInquiry.loadingContact")}
          </div>
        </div>
      ) : null}

      {!loading && receiverPhone ? (
        <>
          <UnitInquiryContactHeader
            name={contactData?.name?.trim() || unit.ownerName?.trim()}
            phone={receiverPhone}
            actions={{
              onCall: handleCall,
              onWhatsApp: handleWhatsApp,
              onRefresh: () => {
                void conversationControls?.refetch();
              },
              callDisabled: !contactData?.phone || loading,
              whatsappDisabled: !(contactData?.whatsapp || contactData?.phone) || loading,
              refreshDisabled:
                !conversationControls || conversationControls.isFetching || loading,
              refreshLoading: conversationControls?.isFetching ?? false,
              callLabel,
              whatsappLabel,
              refreshLabel,
            }}
          />
          <ChatConversation
            phoneNumber={normalizeConversationPhone(receiverPhone) || receiverPhone}
            clientId={currentClientId}
            unitUrl={unitUrl}
            messageLimit={UNIT_CONVERSATION_MESSAGE_LIMIT}
            compact
            fillHeight
            className="flex-1 min-h-0"
            onConversationControls={handleConversationControls}
            onMessagesChange={handleConversationMessages}
          />
          {showChatImageActions && rawUnit ? (
            <ChatImagesToUnit messages={conversationMessages} rawUnit={rawUnit} />
          ) : null}
        </>
      ) : !loading && !receiverPhone && (contactData?.name || contactData?.phone) ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center space-y-1 shrink-0">
          <div className="text-xs text-gray-600">
            {translate("unitInquiry.contactPrefix")}
            {contactData?.type ? ` (${contactData.type})` : ""}
          </div>
          {contactData?.name ? (
            <div className="text-sm font-medium text-gray-900">{contactData.name}</div>
          ) : null}
          {contactData?.phone ? (
            <div className="text-xs text-gray-500" dir="ltr">
              {formatPhoneForDisplay(contactData.phone, 'EG') || contactData.phone}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
