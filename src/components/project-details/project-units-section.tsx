import Link from 'next/link';
import { Building, Bed, Bath, Maximize, Home, ArrowRight } from 'lucide-react';
import type { ProjectUnitsSectionProps } from '@/lib/projects/project-types';

export default function ProjectUnitsSection({ project }: ProjectUnitsSectionProps) {
  // For now, we'll show a placeholder since we don't have actual units data
  // In a real implementation, this would fetch and display actual units
  const hasUnits = project.totalUnits && parseInt(project.totalUnits) > 0;

  if (!hasUnits) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Units</h2>
        
        <div className="text-center py-8">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No units information available</p>
          <Link
            href={`/units?project=${project.title}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Search Units</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Placeholder units data - in real implementation, this would come from API
  const placeholderUnits = [
    {
      id: '1',
      unitTitle: 'Modern Apartment',
      buildingType: 'Apartment',
      roomsCount: 2,
      landArea: 120,
      totalPrice: 2500000,
      purpose: 'residential'
    },
    {
      id: '2',
      unitTitle: 'Luxury Villa',
      buildingType: 'Villa',
      roomsCount: 4,
      landArea: 350,
      totalPrice: 8500000,
      purpose: 'residential'
    },
    {
      id: '3',
      unitTitle: 'Penthouse Suite',
      buildingType: 'Penthouse',
      roomsCount: 3,
      landArea: 280,
      totalPrice: 5200000,
      purpose: 'residential'
    }
  ];

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Available Units</h2>
        <Link
          href={`/units?project=${project.title}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>View All Units</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {placeholderUnits.map((unit) => (
          <Link
            key={unit.id}
            href={`/units/${unit.id}`}
            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
          >
            <div className="space-y-3">
              {/* Unit Type Badge */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {unit.buildingType}
                </span>
                <span className="text-lg font-bold text-green-600">
                  EGP {unit.totalPrice.toLocaleString()}
                </span>
              </div>
              
              {/* Unit Title */}
              <h3 className="font-semibold text-gray-900">{unit.unitTitle}</h3>
              
              {/* Unit Specifications */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Bed className="w-4 h-4" />
                  <span>{unit.roomsCount} Beds</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Maximize className="w-4 h-4" />
                  <span>{unit.landArea} m²</span>
                </div>
              </div>
              
              {/* View Details Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-500">View Details</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* View More Units */}
      <div className="mt-6 text-center">
        <Link
          href={`/units?project=${project.title}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span>View All {project.totalUnits} Units</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
