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

// Function to determine appropriate icon based on specification label
function getIconForSpec(label: string): any {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('bed') || lowerLabel.includes('bedroom')) return Bed;
  if (lowerLabel.includes('bath') || lowerLabel.includes('bathroom')) return Bath;
  if (lowerLabel.includes('area') || lowerLabel.includes('size') || lowerLabel.includes('sq')) return Maximize;
  if (lowerLabel.includes('parking') || lowerLabel.includes('garage')) return Car;
  if (lowerLabel.includes('delivery') || lowerLabel.includes('date') || lowerLabel.includes('year')) return Calendar;
  if (lowerLabel.includes('floor') || lowerLabel.includes('level')) return Building;
  if (lowerLabel.includes('view') || lowerLabel.includes('scenic')) return Camera;
  if (lowerLabel.includes('security') || lowerLabel.includes('safe')) return Shield;
  if (lowerLabel.includes('electric') || lowerLabel.includes('power')) return Zap;
  if (lowerLabel.includes('air') || lowerLabel.includes('conditioning') || lowerLabel.includes('hvac')) return Wind;
  if (lowerLabel.includes('water') || lowerLabel.includes('plumbing')) return Droplet;
  if (lowerLabel.includes('heating') || lowerLabel.includes('temperature')) return Thermometer;
  if (lowerLabel.includes('internet') || lowerLabel.includes('wifi')) return Wifi;
  if (lowerLabel.includes('cable') || lowerLabel.includes('tv')) return Tv;
  if (lowerLabel.includes('balcony') || lowerLabel.includes('terrace') || lowerLabel.includes('outdoor')) return Sun;
  if (lowerLabel.includes('furnished') || lowerLabel.includes('furniture')) return Home;
  if (lowerLabel.includes('lock') || lowerLabel.includes('access')) return Lock;
  if (lowerLabel.includes('key') || lowerLabel.includes('entry')) return Key;
  if (lowerLabel.includes('document') || lowerLabel.includes('paper') || lowerLabel.includes('permit')) return FileText;
  if (lowerLabel.includes('available') || lowerLabel.includes('ready')) return CheckCircle;
  
  return Info; // Default icon
}

interface CombinedQuickFactsProps {
  facts: UnitQuickFactsProps['facts'];
  specs?: SpecItem[];
}

export default function UnitQuickFacts({ facts, specs = [] }: CombinedQuickFactsProps) {
  // Debug: Log incoming data
  console.log('UnitQuickFacts - facts:', facts);
  console.log('UnitQuickFacts - specs:', specs);
  
  // Convert specifications to quick facts format
  const specFacts = specs.map(spec => ({
    label: spec.label,
    value: spec.value,
    icon: 'info' // Will be mapped to appropriate icon
  }));

  // Combine quick facts and specifications
  const allFacts = [...facts, ...specFacts];
  console.log('UnitQuickFacts - allFacts:', allFacts);

  // Temporarily disable deduplication to test
  const deduplicatedFacts = allFacts;
  console.log('UnitQuickFacts - deduplicatedFacts (no dedup):', deduplicatedFacts);

  if (deduplicatedFacts.length === 0) {
    console.log('UnitQuickFacts - No facts to display, returning null');
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h2>
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
