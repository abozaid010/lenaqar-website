import { 
  Building, 
  MapPin, 
  Calendar, 
  Home, 
  Users, 
  DollarSign,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import type { ProjectQuickFactsProps } from '@/lib/projects/project-types';
import { useI18n } from '@/context/translate-api';

const iconMap = {
  building: Building,
  'map-pin': MapPin,
  calendar: Calendar,
  home: Home,
  users: Users,
  'dollar-sign': DollarSign,
  'check-circle': CheckCircle,
  clock: Clock,
};

export default function ProjectQuickFacts({ facts }: ProjectQuickFactsProps) {
  const { t } = useI18n();
  if (facts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{t?.unitQuickFacts?.title || "Quick Facts"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact, index) => {
          const IconComponent = fact.icon && iconMap[fact.icon as keyof typeof iconMap];
          
          return (
            <div 
              key={index}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {IconComponent && (
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">{fact.label}</p>
                <p className="font-semibold text-gray-900 truncate">{fact.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
