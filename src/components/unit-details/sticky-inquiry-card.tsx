import { Phone, MessageCircle, Edit, Trash2, PhoneCall } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/translate-api';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';
import { contactInfo } from '@/lib/contact-info';
import { generateUnitSlug } from '@/lib/units/unit-url-utils';

export default function StickyInquiryCard({ unit }: StickyInquiryCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [contactData, setContactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get current user's client ID from access token (this would come from auth context)
  const getCurrentClientId = () => {
    // TODO: Get actual client ID from access token/auth context
    return 'public'; // Simulated - should match unit.clientId for owner info
  };

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

  const handleDelete = () => {
    // TODO: Implement delete functionality with confirmation
    if (window.confirm('Are you sure you want to delete this property?')) {
      console.log('Delete property action triggered');
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-lg p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t?.unitInquiry?.interestedTitle || "Interested in this property?"}</h3>
        <p className="text-sm text-gray-600">{t?.unitInquiry?.interestedSubtitle || "Get in touch to learn more or schedule a viewing"}</p>
      </div>

      {/* Contact Information */}
      {loading ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600">Loading contact information...</div>
        </div>
      ) : (contactData?.phone || contactData?.whatsapp) ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">Contact ({contactData?.type}):</div>
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
          Call
        </button>
        
        <button
          onClick={handleWhatsApp}
          disabled={!contactData?.whatsapp || loading}
          className="bg-green-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
      </div>

      
      {/* Admin Actions */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleEdit}
            className="border border-blue-300 text-blue-600 rounded-lg py-2 px-3 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          
          <button
            onClick={handleDelete}
            className="border border-red-300 text-red-600 rounded-lg py-2 px-3 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

          </div>
  );
}
