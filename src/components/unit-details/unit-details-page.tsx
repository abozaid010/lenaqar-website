'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import BackButton from '@/components/ui/back-button';
import type { UnitViewModel, RawUnit } from '@/lib/units/unit-types';
import UnitHeroGallery from './unit-hero-gallery';
import UnitHeaderSummary from './unit-header-summary';
import UnitQuickFacts from './unit-quick-facts';
import StickyInquiryCard from './sticky-inquiry-card';
import MobileStickyActionBar from './mobile-sticky-action-bar';
import UnitShareLinksDialog from './unit-share-links-dialog';
import {
  formatCityLabel,
  formatDistrictLabel,
  formatSubDistrictLabel,
} from '@/utils/formatters';

interface UnitDetailsPageProps {
  unit: UnitViewModel;
  rawUnit?: RawUnit;
}

function UnitLocationSection({ unit }: { unit: UnitViewModel }) {
  const { locale, translate, t } = useI18n();
  const [labels, setLabels] = useState({
    city: unit.city || '',
    district: unit.district || '',
    subDistrict: unit.subDistrict || '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadLabels = async () => {
      try {
        const city = unit.city ? await formatCityLabel(unit.city, locale) : '';
        const district =
          unit.city && unit.district
            ? await formatDistrictLabel(unit.district, unit.city, locale)
            : unit.district || '';
        const subDistrict =
          unit.city && unit.district && unit.subDistrict
            ? await formatSubDistrictLabel(
                unit.subDistrict,
                unit.city,
                unit.district,
                locale
              )
            : unit.subDistrict || '';

        if (!cancelled) {
          setLabels({ city, district, subDistrict });
        }
      } catch {
        if (!cancelled) {
          setLabels({
            city: unit.city || '',
            district: unit.district || '',
            subDistrict: unit.subDistrict || '',
          });
        }
      }
    };

    void loadLabels();
    return () => {
      cancelled = true;
    };
  }, [unit.city, unit.district, unit.subDistrict, locale]);

  const projectLabel =
    locale === 'ar' && unit.projectNameAr ? unit.projectNameAr : unit.projectName;

  const rows = [
    {
      key: 'city',
      label: translate('unitDetails.city', t.unitDetails?.city),
      value: labels.city,
    },
    {
      key: 'district',
      label: translate('unitDetails.district', t.unitDetails?.district),
      value: labels.district,
    },
    {
      key: 'subDistrict',
      label: translate('unitDetails.subDistrict', t.unitDetails?.subDistrict),
      value: labels.subDistrict,
    },
    {
      key: 'project',
      label: translate('basicDetails.compound', t.basicDetails?.compound),
      value: projectLabel,
    },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {translate('unitDetails.location', t.unitDetails?.location)}
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map((row) => (
          <div key={row.key}>
            <dt className="text-sm text-gray-600">{row.label}</dt>
            <dd className="text-sm font-medium text-gray-900 mt-1">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function UnitDetailsPage({ unit, rawUnit }: UnitDetailsPageProps) {
  const { t, locale, translate } = useI18n();
  const { isOwnUnit } = useUnitOwnership(unit);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const unitNotes = typeof unit.notes === 'string' ? unit.notes.trim() : '';
  const canShare = Boolean(unit.referenceCode?.trim());

  return (
    <div className="bg-gray-50 flex-1">
      {/* Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <BackButton fallbackRoute="/units" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Gallery */}
            <UnitHeroGallery
              images={unit.heroImages}
              isPrimary={unit.isPrimary}
            />

            {/* Header Summary */}
            <UnitHeaderSummary unit={unit} />

            {/* Location */}
            <UnitLocationSection unit={unit} />

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
                <StickyInquiryCard
                  unit={unit}
                  rawUnit={rawUnit}
                  isOwnUnit={isOwnUnit}
                  canShare={canShare}
                  onShare={() => setShowShareDialog(true)}
                />
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

      <UnitShareLinksDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        unitCode={unit.referenceCode}
      />
    </div>
  );
}
