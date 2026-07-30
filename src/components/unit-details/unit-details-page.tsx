'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import BackButton from '@/components/ui/back-button';
import type { UnitViewModel, RawUnit } from '@/lib/units/unit-types';
import type { UnitViewMode } from '@/lib/units/unit-view-mode';
import { isPrivacyRestrictedViewMode } from '@/lib/units/unit-view-mode';
import UnitHeroGallery from './unit-hero-gallery';
import UnitHeaderSummary from './unit-header-summary';
import UnitPricingSection from './unit-pricing-section';
import UnitQuickFacts from './unit-quick-facts';
import StickyInquiryCard from './sticky-inquiry-card';
import UnitDetailsAdminActions from './unit-details-admin-actions';
import MobileStickyActionBar from './mobile-sticky-action-bar';
import UnitShareLinksDialog from './unit-share-links-dialog';
import CityManager from '@/utils/city_manager';

interface UnitDetailsPageProps {
  unit: UnitViewModel;
  rawUnit?: RawUnit;
  /** Server-computed ownership (same isOwnClientUnit rule as Homey unit pages). */
  isOwnUnit?: boolean;
  /**
   * @deprecated Prefer `viewMode`. Kept for callers that only pass isPublic.
   * Public marketing / privacy-restricted experience.
   */
  isPublic?: boolean;
  /** Canonical viewing mode resolved by the RSC page. */
  viewMode?: UnitViewMode;
  /** Listing client's id — used for permanent share URLs. */
  listingClientId?: string | null;
}

function UnitLocationSection({
  unit,
  hidePhase = false,
}: {
  unit: UnitViewModel;
  hidePhase?: boolean;
}) {
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
        const manager = CityManager.getInstance();
        const resolved = await manager.resolveLocationHierarchyAsync({
          city: unit.city || '',
          district: unit.district || '',
          sub_district: unit.subDistrict || '',
        });
        const next = await manager.getLocationDisplayLabels(resolved, locale);

        if (!cancelled) {
          setLabels({
            city: next.city || resolved.city || '',
            district: next.district || resolved.district || '',
            subDistrict: next.subDistrict || resolved.sub_district || '',
          });
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
      href: unit.projectHref || undefined,
    },
    // Phase / building is internal — never on privacy-restricted pages.
    ...(!hidePhase
      ? [
          {
            key: 'phase',
            label: translate(
              'basicDetails.phase',
              locale === 'ar' ? 'المرحلة / المبنى' : 'Phase / Building'
            ),
            value: unit.phase || '',
          },
        ]
      : []),
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
            <dd className="text-sm font-medium text-gray-900 mt-1">
              {row.href ? (
                <Link
                  href={row.href}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {row.value}
                </Link>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function UnitDetailsPage({
  unit,
  rawUnit,
  isOwnUnit: isOwnUnitProp,
  isPublic: isPublicProp,
  viewMode: viewModeProp,
  listingClientId,
}: UnitDetailsPageProps) {
  const { t, locale, translate } = useI18n();
  const { isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);

  const viewMode: UnitViewMode =
    viewModeProp ||
    (isPublicProp ? 'privacy_mode' : 'same_client_with_permission');
  const isPrivacy = isPrivacyRestrictedViewMode(viewMode);
  const isAnonymousPublic = viewMode === 'privacy_mode';
  const isExternalClient = viewMode === 'external_client';
  // Prefer server truth when true; allow client cookie read to upgrade after hydration.
  // Privacy-restricted modes never treat the viewer as owner.
  const isOwnUnit =
    !isPrivacy && (Boolean(isOwnUnitProp) || isOwnUnitFromHook);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const unitNotes = typeof unit.notes === 'string' ? unit.notes.trim() : '';
  const canShare = Boolean(unit.referenceCode?.trim());
  // CRM chrome: same-client full UI, or external listing-contact card (no chat).
  const showCrmSidebar = !isAnonymousPublic;
  const showAdminActions = viewMode === 'same_client_with_permission';
  const showMobileOwnerBar = viewMode === 'same_client_with_permission';

  return (
    <div
      className={`bg-gray-50 flex-1 ${showMobileOwnerBar ? 'pb-28 lg:pb-0' : ''}`}
    >
      {/* Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <BackButton
            fallbackRoute={isAnonymousPublic ? '/allProberties' : '/units'}
          />
          {showAdminActions && (
            <Suspense fallback={null}>
              <UnitDetailsAdminActions
                unit={unit}
                rawUnit={rawUnit}
                isOwnUnit={isOwnUnit}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={
            showCrmSidebar
              ? 'grid grid-cols-1 lg:grid-cols-3 gap-8'
              : 'space-y-8'
          }
        >
          {/* Left Column - Main Content */}
          <div className={showCrmSidebar ? 'lg:col-span-2 space-y-8' : 'space-y-8'}>
            <UnitHeroGallery
              images={unit.heroImages}
              isPrimary={unit.isPrimary}
              canShare={canShare}
              onShare={() => setShowShareDialog(true)}
            />

            <UnitHeaderSummary unit={unit} />

            <UnitPricingSection unit={unit} />

            <UnitLocationSection unit={unit} hidePhase={isPrivacy} />

            {(unit.quickFacts.length > 0 || unit.specs.length > 0) && (
              <UnitQuickFacts facts={unit.quickFacts} specs={unit.specs} />
            )}

            {unitNotes && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {translate('unit.notes', locale === 'ar' ? 'ملاحظات' : 'Notes')}
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">{unitNotes}</p>
              </div>
            )}
          </div>

          {showCrmSidebar && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
                <div className="hidden lg:block h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
                  <StickyInquiryCard
                    unit={unit}
                    rawUnit={rawUnit}
                    isOwnUnit={isOwnUnit}
                    hideChat={isExternalClient}
                  />
                </div>

                {!isPrivacy && unit.trustItems.length > 0 && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t?.projectPage?.propertyInfo || 'Property Information'}
                    </h3>
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
          )}
        </div>
      </div>

      {showMobileOwnerBar && (
        <MobileStickyActionBar unit={unit} isOwnUnit={isOwnUnit} />
      )}

      <UnitShareLinksDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        unitCode={unit.referenceCode}
        listingClientId={listingClientId ?? unit.clientId}
      />
    </div>
  );
}
