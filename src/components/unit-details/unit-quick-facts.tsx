import { 
  Bed, 
  Bath, 
  Maximize, 
  Trees, 
  Home, 
  Car, 
  Calendar,
  Info,
  Building,
  Package,
  Shield,
  Zap,
  Wind,
  Droplet,
  Sun,
  Wifi,
  Tv,
  Thermometer,
  Camera,
  Lock,
  Key,
  FileText,
  CheckCircle
} from 'lucide-react';
import type { UnitQuickFactsProps, SpecItem } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

const iconMap: Record<string, any> = {
  bed: Bed,
  bath: Bath,
  maximize: Maximize,
  trees: Trees,
  home: Home,
  car: Car,
  calendar: Calendar,
  info: Info,
  building: Building,
  package: Package,
  shield: Shield,
  zap: Zap,
  wind: Wind,
  droplet: Droplet,
  sun: Sun,
  wifi: Wifi,
  tv: Tv,
  thermometer: Thermometer,
  camera: Camera,
  lock: Lock,
  key: Key,
  file: FileText,
  check: CheckCircle,
};

const KEY_ICON_MAP: Record<string, any> = {
  bedrooms: Bed,
  bathrooms: Bath,
  garden: Trees,
  garage: Car,
  furnishing: Home,
  finishing: Shield,
  propertyType: Building,
};

// Fallback icon for specs without a key
function getIconForKey(key?: string): any {
  if (!key) return Info;
  return KEY_ICON_MAP[key] ?? Info;
}

// Keys to exclude — items shown elsewhere (pricing header, specs section)
const EXCLUDED_KEYS = new Set(['referenceCode', 'area', 'delivery', 'totalPrice', 'downPayment', 'installmentYears', 'installmentAmount']);

interface CombinedQuickFactsProps {
  facts: UnitQuickFactsProps['facts'];
  specs?: SpecItem[];
}

export default function UnitQuickFacts({ facts, specs = [] }: CombinedQuickFactsProps) {
  const { t } = useI18n();
  // Convert specifications to quick facts format
  const specFacts = specs.map(spec => ({
    label: spec.label,
    value: spec.value,
    icon: 'info',
    key: spec.key,
  }));

  // Combine quick facts and specifications
  const allFacts = [...facts, ...specFacts];

  // Filter out unwanted items using the stable `key` field (locale-independent)
  const filteredFacts = allFacts.filter(fact => {
    if (fact.key && EXCLUDED_KEYS.has(fact.key)) return false;
    return true;
  });

  // Remove exact duplicates based on label and value
  const deduplicatedFacts = filteredFacts.filter((fact, index, self) => {
    return self.findIndex(otherFact => 
      fact.label.toLowerCase() === otherFact.label.toLowerCase() && 
      fact.value === otherFact.value
    ) === index;
  });

  if (deduplicatedFacts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t?.unitQuickFacts?.title || "Quick Facts"}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {deduplicatedFacts.map((fact, index) => {
          const IconComponent = (fact.icon && iconMap[fact.icon])
            ? iconMap[fact.icon]
            : getIconForKey(fact.key);
          
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
