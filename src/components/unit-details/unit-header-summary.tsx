import Link from 'next/link';
import { User } from 'lucide-react';
import type { UnitHeaderSummaryProps } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

export default function UnitHeaderSummary({ unit }: UnitHeaderSummaryProps) {
  const { translate } = useI18n();
  const buildingTypeLabel = unit.buildingType
    ? translate(`buildingTypes.${String(unit.buildingType).toLowerCase()}`, unit.buildingType)
    : null;

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {unit.title || `${buildingTypeLabel || 'Property'} Details`}
        </h1>

        {/* Developer — skip when it duplicates the project name (location/project live in UnitLocationSection) */}
        {unit.developerName &&
          unit.developerName.trim().toLowerCase() !==
            (unit.projectName || '').trim().toLowerCase() && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {unit.developerHref ? (
              <Link
                href={unit.developerHref}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <User className="w-4 h-4" />
                {unit.developerName}
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-gray-600">
                <User className="w-4 h-4" />
                {unit.developerName}
              </span>
            )}
          </div>
        )}
      </div>

      {unit.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unit.badges.map((badge, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
