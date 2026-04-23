'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import type { UnitViewModel, RawUnit } from '@/lib/units/unit-types';
import UnitHeroGallery from './unit-hero-gallery';
import UnitHeaderSummary from './unit-header-summary';
import UnitQuickFacts from './unit-quick-facts';
import StickyInquiryCard from './sticky-inquiry-card';
import MobileStickyActionBar from './mobile-sticky-action-bar';
import UnitBreadcrumbs from './unit-breadcrumbs';

interface UnitDetailsPageProps {
  unit: UnitViewModel;
  rawUnit?: RawUnit;
}

export default function UnitDetailsPage({ unit, rawUnit }: UnitDetailsPageProps) {
  const [showMobileActionBar, setShowMobileActionBar] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <UnitBreadcrumbs unit={unit} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
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
