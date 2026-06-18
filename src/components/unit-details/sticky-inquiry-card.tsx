import { MessageCircle, Edit, Trash2, PhoneCall, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/hooks/useI18n';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';
import { contactInfo } from '@/lib/contact-info';
import { buildAdminUnitEditPath } from '@/lib/units/unit-share-links';
import { appendUnitsSourcePendingQuery, buildAdminPendingApprovalListPath } from '@/utils/units-navigation-source';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import { useDeleteUnit } from '@/hooks/use-unit-mutations';
import { useUnitsSectionSource } from '@/hooks/use-units-section-source';
import DeleteConfirmDialog from '@/components/ui/confirm-delete-dialog';
import UnitApproveButton, { isUnitPendingApproval } from './unit-approve-button';
import toast from 'react-hot-toast';
import type { UseMutationResult } from '@tanstack/react-query';

export default function StickyInquiryCard({
  unit,
  rawUnit,
  isOwnUnit: isOwnUnitProp,
  canShare = false,
  onShare,
}: StickyInquiryCardProps) {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const { myClientId: currentClientId, isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);
  const isOwnUnit = isOwnUnitProp ?? isOwnUnitFromHook;
  const unitsSection = useUnitsSectionSource();
  const showApproveButton = Boolean(
    rawUnit && isUnitPendingApproval(rawUnit, unitsSection === 'pending_approval')
  );
  const deleteUnitMutation = useDeleteUnit() as unknown as UseMutationResult<string, Error, string, unknown>;
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleWhatsApp = () => {
    if (contactData?.whatsapp) {
      // Remove any non-digit characters for WhatsApp
      const cleanNumber = contactData.whatsapp.replace(/[^\d]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    } else {
      console.log('No WhatsApp number available');
    }
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
    <div className="bg-white rounded-lg border shadow-lg p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {translate("unitInquiry.interestedTitle")}
        </h3>
        <p className="text-sm text-gray-600">
          {translate("unitInquiry.interestedSubtitle")}
        </p>
      </div>

      {/* Contact Information */}
      {loading ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600">
            {translate("unitInquiry.loadingContact")}
          </div>
        </div>
      ) : (contactData?.name || contactData?.phone || contactData?.whatsapp) ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center space-y-1">
          <div className="text-xs text-gray-600">
            {translate("unitInquiry.contactPrefix")}
            {contactData?.type ? ` (${contactData.type})` : ""}
          </div>
          {showOwnerContact && unit.ownerName?.trim() && (
            <div className="text-sm font-medium text-gray-900">
              {translate("saleDetails.ownerName", "Owner Name")}: {unit.ownerName}
            </div>
          )}
          {showOwnerContact && unit.ownerMobile?.trim() && (
            <div className="text-sm text-gray-800">
              {translate("saleDetails.ownerMobile", "Owner Mobile")}: {unit.ownerMobile}
            </div>
          )}
          {!showOwnerContact && contactData?.name && (
            <div className="text-sm font-medium text-gray-900">{contactData.name}</div>
          )}
          {!showOwnerContact && contactData?.phone && (
            <div className="text-xs text-gray-500">{contactData.phone}</div>
          )}
        </div>
      ) : null}

      {/* Primary CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCall}
          disabled={!contactData?.phone || loading}
          className="bg-blue-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <PhoneCall className="w-4 h-4" />
          {callLabel}
        </button>
        
        <button
          onClick={handleWhatsApp}
          disabled={!contactData?.whatsapp || loading}
          className="bg-green-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <MessageCircle className="w-4 h-4" />
          {whatsappLabel}
        </button>
      </div>

      {canShare && onShare && (
        <button
          type="button"
          onClick={onShare}
          className="w-full border border-primary/30 text-primary rounded-lg py-2 px-3 font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Share2 className="w-4 h-4" />
          {translate("unitShare.title", "Share Property")}
        </button>
      )}

      {/* Admin Actions — not shown for primary units when the viewer is another client */}
      {showUnitAdminActions ? (
        <div className="border-t pt-4 space-y-3">
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
