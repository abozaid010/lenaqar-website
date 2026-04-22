import Link from 'next/link';
import { MapPin, Building, User, Tag } from 'lucide-react';
import type { UnitHeaderSummaryProps } from '@/lib/units/unit-types';

export default function UnitHeaderSummary({ unit }: UnitHeaderSummaryProps) {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {unit.title || `${unit.buildingType || 'Property'} Details`}
        </h1>
        
        {/* Project and Developer Links */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {unit.projectHref && unit.projectName && (
            <Link 
              href={unit.projectHref}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Building className="w-4 h-4" />
              {unit.projectName}
            </Link>
          )}
          {unit.projectName && !unit.projectHref && (
            <span className="flex items-center gap-1 text-gray-600">
              <Building className="w-4 h-4" />
              {unit.projectName}
            </span>
          )}

          {unit.developerHref && unit.developerName && (
            <Link 
              href={unit.developerHref}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <User className="w-4 h-4" />
              {unit.developerName}
            </Link>
          )}
          {unit.developerName && !unit.developerHref && (
            <span className="flex items-center gap-1 text-gray-600">
              <User className="w-4 h-4" />
              {unit.developerName}
            </span>
          )}
        </div>
      </div>

      {/* Location */}
      {unit.locationLabel && (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-5 h-5" />
          <span className="text-lg">{unit.locationLabel}</span>
        </div>
      )}

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price */}
        {unit.totalPrice && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Price</div>
            <div className="text-2xl font-bold text-gray-900">{unit.totalPrice}</div>
          </div>
        )}

        {/* Building Type */}
        {unit.buildingType && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Property Type</div>
            <div className="text-lg font-semibold text-gray-900">{unit.buildingType}</div>
          </div>
        )}

        {/* Delivery Date */}
        {unit.deliveryDateLabel && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Delivery</div>
            <div className="text-lg font-semibold text-gray-900">{unit.deliveryDateLabel}</div>
          </div>
        )}

        {/* Reference Code */}
        {unit.referenceCode && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Reference</div>
            <div className="text-lg font-semibold text-gray-900">{unit.referenceCode}</div>
          </div>
        )}
      </div>

      {/* Badges */}
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
