import { Star } from 'lucide-react';
import type { ProjectViewModel } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
}

export default function ProjectFacilityManagement({ project }: Props) {
  const fm = project.facilityManagement;
  if (!fm?.name?.trim()) return null;

  const rating = fm.rating != null ? Number(fm.rating) : null;
  const fullStars = rating != null ? Math.floor(rating) : 0;
  const hasHalf = rating != null && rating - fullStars >= 0.5;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Facility Management</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{fm.name}</h3>
          {rating != null && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < fullStars
                      ? 'text-yellow-400 fill-yellow-400'
                      : i === fullStars && hasHalf
                      ? 'text-yellow-400 fill-yellow-200'
                      : 'text-gray-200 fill-gray-200'
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">{rating}/5</span>
            </div>
          )}
        </div>
        {fm.description && (
          <p className="text-sm text-gray-600">{fm.description}</p>
        )}
      </div>
    </div>
  );
}
