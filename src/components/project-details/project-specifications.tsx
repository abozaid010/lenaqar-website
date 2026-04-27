import { CheckCircle, Info } from 'lucide-react';
import type { ProjectSpecificationsProps } from '@/lib/projects/project-types';

export default function ProjectSpecifications({ specs }: ProjectSpecificationsProps) {
  if (specs.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Specifications</h2>
      
      <div className="space-y-4">
        {specs.map((spec, index) => (
          <div 
            key={index}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-gray-900">{spec.label}</p>
                {spec.label.includes('Status') || spec.label.includes('Phase') ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {spec.label}
                  </span>
                ) : null}
              </div>
              <p className="text-gray-700">{spec.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Project Information</p>
            <p className="text-sm text-blue-700">
              Detailed specifications are subject to change based on project development phases. 
              Please contact the developer for the most current information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
