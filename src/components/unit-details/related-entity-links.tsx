import Link from 'next/link';
import { ArrowRight, Building, User, Home } from 'lucide-react';
import type { RelatedEntityLinksProps } from '@/lib/units/unit-types';

export default function RelatedEntityLinks({ unit }: RelatedEntityLinksProps) {
  const hasProjectLink = unit.projectHref && unit.projectName;
  const hasDeveloperLink = unit.developerHref && unit.developerName;
  
  if (!hasProjectLink && !hasDeveloperLink) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Explore More</h2>
      
      <div className="space-y-4">
        {/* Project Link */}
        {hasProjectLink && (
          <Link
            href={unit.projectHref}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">View Project Details</div>
                <div className="text-sm text-gray-600">
                  Explore more about {unit.projectName}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        )}

        {/* Developer Link */}
        {hasDeveloperLink && (
          <Link
            href={unit.developerHref}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">View Developer Details</div>
                <div className="text-sm text-gray-600">
                  Learn more about {unit.developerName}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        )}

        {/* Similar Units (Placeholder) */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Similar Units</div>
              <div className="text-sm text-gray-600">
                View similar properties in this project
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
