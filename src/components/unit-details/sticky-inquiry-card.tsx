import { Phone, MessageCircle, Edit, Trash2, PhoneCall } from 'lucide-react';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';

export default function StickyInquiryCard({ unit }: StickyInquiryCardProps) {
  // Get the best phone number (owner first, then developer)
  const getPrimaryPhone = () => {
    return unit.ownerPhone || unit.developerPhone;
  };

  // Get the best WhatsApp number (owner first, then developer)
  const getPrimaryWhatsapp = () => {
    return unit.ownerWhatsapp || unit.developerWhatsapp || getPrimaryPhone();
  };

  // Get contact name for display
  const getContactName = () => {
    if (unit.ownerName) return unit.ownerName;
    if (unit.developerName) return unit.developerName;
    return 'Property Contact';
  };

  const handleCall = () => {
    const phone = getPrimaryPhone();
    if (phone) {
      window.open(`tel:${phone}`, '_blank');
    } else {
      console.log('No phone number available');
    }
  };

  const handleWhatsApp = () => {
    const whatsapp = getPrimaryWhatsapp();
    if (whatsapp) {
      // Remove any non-digit characters for WhatsApp
      const cleanNumber = whatsapp.replace(/[^\d]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    } else {
      console.log('No WhatsApp number available');
    }
  };

  
  const handleEdit = () => {
    // TODO: Implement edit functionality - navigate to edit page
    console.log('Edit property action triggered');
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interested in this property?</h3>
        <p className="text-sm text-gray-600">Get in touch to learn more or schedule a viewing</p>
      </div>

      {/* Contact Information */}
      {(getPrimaryPhone() || getPrimaryWhatsapp()) && (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">Contact:</div>
          <div className="text-sm font-medium text-gray-900">{getContactName()}</div>
          {getPrimaryPhone() && (
            <div className="text-xs text-gray-500 mt-1">{getPrimaryPhone()}</div>
          )}
        </div>
      )}

      {/* Primary CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCall}
          disabled={!getPrimaryPhone()}
          className="bg-blue-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <PhoneCall className="w-4 h-4" />
          Call
        </button>
        
        <button
          onClick={handleWhatsApp}
          disabled={!getPrimaryWhatsapp()}
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

      {/* Trust Indicators */}
      <div className="border-t pt-4">
        <div className="text-center text-xs text-gray-500 space-y-1">
          <div>Responsive team</div>
          <div>Verified listings</div>
          <div>Secure communication</div>
        </div>
      </div>
    </div>
  );
}
