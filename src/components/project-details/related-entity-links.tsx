import Link from 'next/link';
import { Building, User, ArrowRight, FolderOpen } from 'lucide-react';
import type { RelatedEntityLinksProps } from '@/lib/projects/project-types';
import { useI18n } from '@/hooks/useI18n';

export default function RelatedEntityLinks({ project }: RelatedEntityLinksProps) {
  const { translate } = useI18n();

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{translate('projectDetails.relatedInformation')}</h2>

      <div className="space-y-4">
        {/* Units in Project */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{translate('projectDetails.unitsInProject')}</h3>
                <p className="text-sm text-gray-600">
                  {project.totalUnits
                    ? translate('projectDetails.unitsAvailable')?.replace('{count}', String(project.totalUnits)) || `${project.totalUnits} units`
                    : translate('projectDetails.viewAllUnits')
                  }
                </p>
              </div>
            </div>
            <Link
              href={`/${project.clientId || 'public'}/units?project_name=${encodeURIComponent(project.title)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{translate('projectDetails.viewUnits')}</span>
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
                  <h3 className="font-semibold text-gray-900">{translate('projectDetails.developer')}</h3>
                  <p className="text-sm text-gray-600">{project.developerName}</p>
                </div>
              </div>
              <Link
                href={`/${project.clientId || 'public'}/developers`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>{translate('projectDetails.allDevelopers')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
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
                <h3 className="font-semibold text-gray-900">{translate('projectDetails.allProjects')}</h3>
                <p className="text-sm text-gray-600">{translate('projectDetails.browseAllProjects')}</p>
              </div>
            </div>
            <Link
              href={`/${project.clientId || 'public'}/myProjects`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>{translate('projectDetails.allProjects')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
