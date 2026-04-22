import { Phone, MessageCircle, Mail, Calendar } from 'lucide-react';
import type { StickyInquiryCardProps } from '@/lib/units/unit-types';

export default function StickyInquiryCard({ unit }: StickyInquiryCardProps) {
  const handleCall = () => {
    // TODO: Implement actual phone number logic
    console.log('Call action triggered');
  };

  const handleWhatsApp = () => {
    // TODO: Implement WhatsApp integration
    console.log('WhatsApp action triggered');
  };

  const handleEmail = () => {
    // TODO: Implement email contact
    console.log('Email action triggered');
  };

  const handleSchedule = () => {
    // TODO: Implement scheduling logic
    console.log('Schedule viewing action triggered');
  };

  return (
    <div className="bg-white rounded-lg border shadow-lg p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interested in this property?</h3>
        <p className="text-sm text-gray-600">Get in touch to learn more or schedule a viewing</p>
      </div>

      {/* Primary CTA */}
      <button
        onClick={handleCall}
        className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Phone className="w-5 h-5" />
        Request Details
      </button>

      {/* Secondary CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleWhatsApp}
          className="bg-green-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        
        <button
          onClick={handleEmail}
          className="bg-gray-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
      </div>

      {/* Schedule Viewing */}
      <button
        onClick={handleSchedule}
        className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 px-4 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        Schedule Viewing
      </button>

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
