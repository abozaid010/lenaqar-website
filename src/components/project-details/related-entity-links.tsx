import Link from 'next/link';
import { Building, User, ArrowRight, FolderOpen } from 'lucide-react';
import type { RelatedEntityLinksProps } from '@/lib/projects/project-types';

export default function RelatedEntityLinks({ project }: RelatedEntityLinksProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Related Information</h2>
      
      <div className="space-y-4">
        {/* Units in Project */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Units in Project</h3>
                <p className="text-sm text-gray-600">
                  {project.totalUnits ? `${project.totalUnits} units available` : 'View all units'}
                </p>
              </div>
            </div>
            <Link 
              href={`/units?project=${project.title}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>View Units</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Developer Information */}
        {project.developerName && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Developer</h3>
                  <p className="text-sm text-gray-600">{project.developerName}</p>
                </div>
              </div>
              {project.developerHref ? (
                <Link 
                  href={project.developerHref}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
                  No Profile
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back to Projects */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">All Projects</h3>
                <p className="text-sm text-gray-600">Browse all available projects</p>
              </div>
            </div>
            <Link 
              href="/myProjects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>All Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Project Phases */}
        {project.phases && project.phases.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Project Phases</h3>
                <p className="text-sm text-blue-700">{project.phases.length} phases planned</p>
              </div>
            </div>
            <div className="space-y-2">
              {project.phases.map((phase, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-blue-800">{phase}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
