import Link from 'next/link';
import { MapPin, Building, User, Globe } from 'lucide-react';
import type { UnitLocationContextProps } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

export default function UnitLocationContext({ unit }: UnitLocationContextProps) {
  const { t } = useI18n();
  const hasLocation = unit.locationLabel || unit.projectName || unit.developerName;
  
  if (!hasLocation) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t('unitLocation.locationAndContext')}</h2>
      </div>

      {/* Location Summary */}
      {unit.locationLabel && (
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('unitLocation.location')}</div>
            <div className="text-lg font-medium text-gray-900">{unit.locationLabel}</div>
          </div>
        </div>
      )}

      {/* Project Context */}
      {unit.projectName && (
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">{t('unitLocation.project')}</div>
            {unit.projectHref ? (
              <Link 
                href={unit.projectHref}
                className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {unit.projectName}
              </Link>
            ) : (
              <div className="text-lg font-medium text-gray-900">{unit.projectName}</div>
            )}
            <div className="text-sm text-gray-600 mt-1">
              {t('unitLocation.partOfProject', { 
                projectName: unit.projectName, 
                developerName: unit.developerName 
              })}
            </div>
          </div>
        </div>
      )}

      {/* Developer Context */}
      {unit.developerName && (
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">{t('unitLocation.developer')}</div>
            {unit.developerHref ? (
              <Link 
                href={unit.developerHref}
                className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {unit.developerName}
              </Link>
            ) : (
              <div className="text-lg font-medium text-gray-900">{unit.developerName}</div>
            )}
          </div>
        </div>
      )}

      {/* Combined Context Summary */}
      {unit.projectName && unit.developerName && unit.locationLabel && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">{t('unitLocation.propertyOverview')}</div>
          <p className="text-gray-900">
            {t('unitLocation.locatedIn', { location: unit.locationLabel })}
            {' '}
            {t('unitLocation.partOfProject', { 
              projectName: unit.projectName, 
              developerName: unit.developerName 
            })}
            {unit.developerName && (
              <>
                {' '}{t('unitLocation.by')}{' '}
                {unit.developerHref ? (
                  <Link href={unit.developerHref} className="font-medium text-blue-600 hover:text-blue-800">
                    {unit.developerName}
                  </Link>
                ) : (
                  <span className="font-medium">{unit.developerName}</span>
                )}
              </>
            )}.
          </p>
        </div>
      )}
    </div>
  );
}
