import { Info } from 'lucide-react';
import type { UnitSpecificationsProps } from '@/lib/units/unit-types';
import { useI18n } from '@/context/translate-api';

export default function UnitSpecifications({ specs }: UnitSpecificationsProps) {
  const { t } = useI18n();
  if (specs.length === 0) {
    return null;
  }

  // Split specs into two columns for desktop
  const halfLength = Math.ceil(specs.length / 2);
  const leftColumn = specs.slice(0, halfLength);
  const rightColumn = specs.slice(halfLength);

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Info className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t?.unitSpecifications?.title || "Specifications"}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {leftColumn.map((spec, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{spec.label}</span>
              <span className="text-sm font-medium text-gray-900 text-right">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {rightColumn.map((spec, index) => (
            <div key={index + halfLength} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{spec.label}</span>
              <span className="text-sm font-medium text-gray-900 text-right">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
