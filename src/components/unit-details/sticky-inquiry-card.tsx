import { Edit, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/hooks/useI18n';
import type { ChatTurn } from '@/hooks/useConversation';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';
import { contactInfo } from '@/lib/contact-info';
import { buildAdminUnitEditPath, buildPublicUnitShareUrl } from '@/lib/units/unit-share-links';
import ChatConversation from '@/components/chat/chat-conversation';
import ChatImagesToUnit from '@/components/unit-details/chat-images-to-unit';
import UnitInquiryContactHeader from '@/components/unit-details/unit-inquiry-contact-header';
import { UNIT_CONVERSATION_MESSAGE_LIMIT } from '@/constants/conversation-limits';
import { formatPhoneForDisplay } from '@/components/phone/phone-utils';
import { normalizeConversationPhone } from '@/utils/api';
import { handleOpenWhatsApp } from '@/utils/phone-utils';
import { appendUnitsSourcePendingQuery, buildAdminPendingApprovalListPath } from '@/utils/units-navigation-source';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import { useDeleteUnit } from '@/hooks/use-unit-mutations';
import { useUnitsSectionSource } from '@/hooks/use-units-section-source';
import DeleteConfirmDialog from '@/components/ui/confirm-delete-dialog';
import UnitApproveButton, { isUnitPendingApproval } from './unit-approve-button';
import toast from 'react-hot-toast';
import type { UseMutationResult } from '@tanstack/react-query';

/** TEMP: set to true to restore the pending-approval approve action on unit detail. */
const SHOW_UNIT_APPROVE_BUTTON = false;

export default function StickyInquiryCard({
  unit,
  rawUnit,
  isOwnUnit: isOwnUnitProp,
}: StickyInquiryCardProps) {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const { myClientId: currentClientId, isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);
  const isOwnUnit = isOwnUnitProp ?? isOwnUnitFromHook;
  const unitsSection = useUnitsSectionSource();
  const showApproveButton = SHOW_UNIT_APPROVE_BUTTON && Boolean(
    rawUnit && isUnitPendingApproval(rawUnit, unitsSection === 'pending_approval')
  );
  const deleteUnitMutation = useDeleteUnit() as unknown as UseMutationResult<string, Error, string, unknown>;
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const showUnitAdminActions = isOwnUnit;

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

  
  const handleEdit = () => {
    if (!unit.referenceCode?.trim()) return;
    const editUrl = appendUnitsSourcePendingQuery(
      buildAdminUnitEditPath(unit.referenceCode, currentClientId),
      unitsSection === 'pending_approval'
    );
    router.push(editUrl);
  };

  const handleDelete = async () => {
    if (!unit?.id) return;
    try {
      await deleteUnitMutation.mutateAsync(unit.id);
      toast.success(translate("toasts.unitDeleted") || (locale === "ar" ? "تم حذف الوحدة بنجاح" : "Unit deleted successfully"));
      setShowDeleteConfirm(false);
      router.push(
        unitsSection === 'pending_approval'
          ? buildAdminPendingApprovalListPath(currentClientId)
          : '/units'
      );
    } catch (error: any) {
      toast.error(error?.message || translate("toasts.errorProcessing") || (locale === "ar" ? "حدث خطأ أثناء معالجة الطلب" : "Failed to process request"));
    }
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
          {showUnitAdminActions && rawUnit ? (
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

      {/* Admin Actions — not shown for primary units when the viewer is another client */}
      {showUnitAdminActions ? (
        <div className="border-t pt-3 space-y-3 shrink-0">
          {showApproveButton && rawUnit ? (
            <>
              {unit.referenceCode?.trim() ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleEdit}
                    className="border border-blue-300 text-blue-600 rounded-lg py-2 px-3 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    {translate("buttons.edit")}
                  </button>
                  <UnitApproveButton rawUnit={rawUnit} variant="inline" />
                </div>
              ) : (
                <UnitApproveButton rawUnit={rawUnit} variant="inline" />
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border border-red-300 text-red-600 rounded-lg py-2 px-3 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {translate("buttons.delete")}
              </button>
            </>
          ) : (
            <div className={`grid gap-3 ${unit.referenceCode?.trim() ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {unit.referenceCode?.trim() && (
                <button
                  onClick={handleEdit}
                  className="border border-blue-300 text-blue-600 rounded-lg py-2 px-3 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  {translate("buttons.edit")}
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="border border-red-300 text-red-600 rounded-lg py-2 px-3 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {translate("buttons.delete")}
              </button>
            </div>
          )}
        </div>
      ) : null}

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!deleteUnitMutation.isPending) setShowDeleteConfirm(false);
        }}
        onConfirm={handleDelete}
        title={translate("unitPage.deleteUnit", locale === "ar" ? "حذف الوحدة" : "Delete Unit")}
        message={translate("unitPage.confirmDeleteMsg", locale === "ar" ? "هل أنت متأكد أنك تريد حذف هذه الوحدة؟" : "Are you sure you want to delete this unit?")}
        confirmLabel={deleteUnitMutation.isPending ? translate("common.loading", locale === "ar" ? "جارٍ الحذف..." : "Deleting...") : translate("buttons.delete", locale === "ar" ? "حذف" : "Delete")}
        cancelLabel={translate("buttons.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
      />
    </div>
  );
}
