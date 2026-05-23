'use client';

import { useState } from 'react';
import {
  Bed,
  Bath,
  Maximize,
  Calendar,
  Phone,
  MessageCircle,
  Home,
  MapPin,
  Building,
  User,
  ChevronRight,
  Image as ImageIcon,
  Share2,
  Heart
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import BackButton from '@/components/ui/back-button';
import type { UnitViewModel, RawUnit } from '@/lib/units/unit-types';
import UnitHeroGallery from './unit-hero-gallery';
import UnitHeaderSummary from './unit-header-summary';
import UnitQuickFacts from './unit-quick-facts';
import StickyInquiryCard from './sticky-inquiry-card';
import MobileStickyActionBar from './mobile-sticky-action-bar';

interface UnitDetailsPageProps {
  unit: UnitViewModel;
  rawUnit?: RawUnit;
}

export default function UnitDetailsPage({ unit, rawUnit }: UnitDetailsPageProps) {
  const { t, locale, translate } = useI18n();
  const [showMobileActionBar, setShowMobileActionBar] = useState(true);
  const unitNotes = typeof unit.notes === 'string' ? unit.notes.trim() : '';

  return (
    <div className="bg-gray-50 flex-1">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <BackButton fallbackRoute="/admin/units" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Gallery */}
            <UnitHeroGallery images={unit.heroImages} isPrimary={unit.isPrimary} />

            {/* Header Summary */}
            <UnitHeaderSummary unit={unit} />

            {/* Quick Facts */}
            {(unit.quickFacts.length > 0 || unit.specs.length > 0) && (
              <UnitQuickFacts facts={unit.quickFacts} specs={unit.specs} />
            )}

            {/* Notes */}
            {unitNotes && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {translate('unit.notes', locale === 'ar' ? 'ملاحظات' : 'Notes')}
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">{unitNotes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Sticky Inquiry Card - Desktop Only */}
              <div className="hidden lg:block">
                <StickyInquiryCard unit={unit} />
              </div>

              {/* Trust/Metadata */}
              {unit.trustItems.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t?.projectPage?.propertyInfo || 'Property Information'}</h3>
                  <div className="space-y-3">
                    {unit.trustItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <MobileStickyActionBar unit={unit} />
      </div>
    </div>
  );
}
