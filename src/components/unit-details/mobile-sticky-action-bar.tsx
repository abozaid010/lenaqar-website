import { Phone, MessageCircle, Mail } from 'lucide-react';
import type { MobileStickyActionBarProps } from '@/lib/units/unit-types';

export default function MobileStickyActionBar({ unit }: MobileStickyActionBarProps) {
  const handlePrimaryAction = () => {
    // TODO: Implement primary contact action
  };

  const handleWhatsApp = () => {
    // TODO: Implement WhatsApp integration
  };

  const handleCall = () => {
    // TODO: Implement phone call
  };

  return (
    <div className="bg-white border-t p-4">
      <div className="flex items-center gap-3">
        {/* Primary CTA */}
        <button
          onClick={handlePrimaryAction}
          className="flex-1 bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Phone className="w-5 h-5" />
          Contact Agent
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 transition-colors"
            aria-label="Contact via WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleCall}
            className="bg-gray-600 text-white rounded-lg p-3 hover:bg-gray-700 transition-colors"
            aria-label="Call now"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Price Display (if available) */}
      {unit.totalPrice && (
        <div className="mt-3 text-center">
          <div className="text-sm text-gray-600">Starting from</div>
          <div className="text-lg font-bold text-gray-900">{unit.totalPrice}</div>
        </div>
      )}
    </div>
  );
}
