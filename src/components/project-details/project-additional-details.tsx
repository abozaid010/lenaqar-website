import type { ProjectViewModel } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
}

export default function ProjectAdditionalDetails({ project }: Props) {
  const hasFinishing = project.finishingTypes.length > 0;
  if (!hasFinishing) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.primaryUnitsSoldOut
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {project.primaryUnitsSoldOut ? 'Sold Out' : 'Available'}
        </span>
      </div>

      {hasFinishing && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Finishing Types</p>
          <div className="flex flex-wrap gap-2">
            {project.finishingTypes.map((type, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
