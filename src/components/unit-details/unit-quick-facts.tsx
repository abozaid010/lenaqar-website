import { 
  Bed, 
  Bath, 
  Maximize, 
  Trees, 
  Home, 
  Car, 
  Calendar 
} from 'lucide-react';
import type { UnitQuickFactsProps } from '@/lib/units/unit-types';

const iconMap: Record<string, any> = {
  bed: Bed,
  bath: Bath,
  maximize: Maximize,
  trees: Trees,
  home: Home,
  car: Car,
  calendar: Calendar,
};

export default function UnitQuickFacts({ facts }: UnitQuickFactsProps) {
  if (facts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {facts.map((fact, index) => {
          const IconComponent = iconMap[fact.icon];
          return (
            <div
              key={index}
              className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg"
            >
              {IconComponent && (
                <IconComponent className="w-6 h-6 text-gray-600 mb-2" />
              )}
              <div className="text-sm font-medium text-gray-900">{fact.value}</div>
              <div className="text-xs text-gray-600 mt-1">{fact.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
