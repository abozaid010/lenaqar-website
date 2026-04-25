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
import { useI18n } from '@/context/translate-api';

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

// Simple icon mapping for remaining items after filtering
function getIconForSpec(label: string): any {
  const lowerLabel = label.toLowerCase();
  
  // Only handle the core items that remain after filtering
  if (lowerLabel.includes('bed') || lowerLabel.includes('room')) return Bed;
  if (lowerLabel.includes('bath')) return Bath;
  if (lowerLabel.includes('garden')) return Trees;
  if (lowerLabel.includes('garage') || lowerLabel.includes('parking')) return Car;
  if (lowerLabel.includes('furnish')) return Home;
  if (lowerLabel.includes('finish')) return Shield;
  if (lowerLabel.includes('type') || lowerLabel.includes('building')) return Building;
  
  return Info; // Default icon
}

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
    icon: 'info' // Will be mapped to appropriate icon
  }));

  // Combine quick facts and specifications
  const allFacts = [...facts, ...specFacts];

  // Filter out unwanted items based on exact JSON field mapping
  const filteredFacts = allFacts.filter(fact => {
    const labelLower = fact.label.toLowerCase();
    
    // Remove items that correspond to these exact JSON fields:
    // - code (Reference Code)
    // - deliveryDate (Delivery Date/Delivery)  
    // - landArea (Area)
    // - totalPrice (already shown in header pricing)
    // - downPayment (already shown in header pricing)
    // - installment_years (already shown in header pricing)
    // - installment_amount_yearly (already shown in header pricing)
    
    if (labelLower.includes('reference') || labelLower.includes('code')) {
      return false; // Remove code field
    }
    
    if (labelLower.includes('delivery') || labelLower.includes('date')) {
      return false; // Remove deliveryDate field
    }
    
    if (labelLower.includes('area') || labelLower.includes('size') || labelLower.includes('sq')) {
      return false; // Remove landArea field
    }
    
    if (labelLower.includes('price') || labelLower.includes('payment') || labelLower.includes('installment')) {
      return false; // Remove pricing fields already shown in header
    }
    
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
          // Determine icon: use iconMap for quick facts, getIconForSpec for specifications
          const IconComponent = fact.icon && iconMap[fact.icon] 
            ? iconMap[fact.icon] 
            : getIconForSpec(fact.label);
          
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
