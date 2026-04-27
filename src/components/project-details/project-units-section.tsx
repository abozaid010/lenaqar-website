import Link from 'next/link';
import { Building, ArrowRight } from 'lucide-react';
import type { ProjectUnitsSectionProps } from '@/lib/projects/project-types';

export default function ProjectUnitsSection({ project }: ProjectUnitsSectionProps) {
  // For now, we'll show a placeholder since we don't have actual units data
  // In a real implementation, this would fetch and display actual units
  const hasUnits = project.totalUnits && parseInt(project.totalUnits) > 0;

  const unitsHref = `/${project.clientId || 'public'}/units?project_name=${encodeURIComponent(project.title)}`;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Units</h2>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Building className="w-14 h-14 text-gray-300" />
        <p className="text-gray-600">
          {hasUnits
            ? `This project has ${project.totalUnits} units. Browse them on the units page.`
            : 'Browse all units in this project on the units page.'}
        </p>
        <Link
          href={unitsHref}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <span>{hasUnits ? `View All ${project.totalUnits} Units` : 'View Units'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
