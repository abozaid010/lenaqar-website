import { MessageCircle, Edit, Trash2, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/hooks/useI18n';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';
import { contactInfo } from '@/lib/contact-info';
import { generateUnitSlug } from '@/lib/units/unit-url-utils';
import { LenaCookiesManager } from '@/lib/LenaCookiesManager';
import { useDeleteUnit } from '@/hooks/use-unit-mutations';
import DeleteConfirmDialog from '@/components/ui/confirm-delete-dialog';
import toast from 'react-hot-toast';

export default function StickyInquiryCard({ unit }: StickyInquiryCardProps) {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const deleteUnitMutation = useDeleteUnit();
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get current user's client ID from access token (this would come from auth context)
  const getCurrentClientId = () => {
    return LenaCookiesManager.getClientId() || null;
  };

  const currentClientId = getCurrentClientId();
  // Hide edit/delete for primary inventory when the viewer is not the unit's client.
  const showUnitAdminActions =
    !unit.isPrimary || (unit.clientId ?? null) === (currentClientId ?? null);

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
        const currentClientId = getCurrentClientId();
        const contact = await contactInfo.get_contact_info({
          clientId: unit.clientId,
          developerId: unit.developerId,
          isPrimary: unit.isPrimary,
          ownerName: unit.ownerName,
          ownerMobile: unit.ownerMobile,
          developerName: unit.developerName
        }, currentClientId);
        
        setContactData(contact);
      } catch (error) {
        console.error('Error loading contact info:', error);
        setContactData({
          name: null,
          phone: null,
          whatsapp: null,
          type: null
        });
      } finally {
        setLoading(false);
      }
    };

    loadContactInfo();
  }, [unit]);

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
    // Navigate to admin edit page for the unit using new slug-based URL
    try {
      const slug = generateUnitSlug({
        buildingType: unit.buildingType,
        project: unit.projectName,
        code: unit.referenceCode, // Use referenceCode as fallback for code
        unitId: unit.id
      });
      const editUrl = `/admin/units/${slug}/edit`;
      router.push(editUrl);
    } catch (error) {
      console.error('Error navigating to edit page:', error);
      // Fallback to old URL format if needed
      if (unit.id) {
        router.push(`/admin/units/${unit.id}/edit`);
      }
    }
  };

  const handleDelete = async () => {
    if (!unit?.id) return;
    try {
      await deleteUnitMutation.mutateAsync(unit.id);
      toast.success(translate("toasts.unitDeleted", locale === "ar" ? "تم حذف الوحدة بنجاح" : "Unit deleted successfully"));
      setShowDeleteConfirm(false);
      router.push('/units');
    } catch (error: any) {
      toast.error(error?.message || translate("toasts.errorProcessing", locale === "ar" ? "حدث خطأ أثناء معالجة الطلب" : "Failed to process request"));
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
      ) : (contactData?.phone || contactData?.whatsapp) ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">
            {translate("unitInquiry.contactPrefix")} ({contactData?.type}):
          </div>
          <div className="text-sm font-medium text-gray-900">{contactData?.name}</div>
          {contactData?.phone && (
            <div className="text-xs text-gray-500 mt-1">{contactData.phone}</div>
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

      {/* Admin Actions — not shown for primary units when the viewer is another client */}
      {showUnitAdminActions ? (
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleEdit}
              className="border border-blue-300 text-blue-600 rounded-lg py-2 px-3 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Edit className="w-4 h-4" />
              {translate("buttons.edit")}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-red-300 text-red-600 rounded-lg py-2 px-3 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {translate("buttons.delete")}
            </button>
          </div>
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
