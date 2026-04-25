import { Star } from 'lucide-react';
import type { ProjectViewModel } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
}

export default function ProjectFacilityManagement({ project }: Props) {
  const fm = project.facilityManagement;
  if (!fm?.name?.trim()) return null;

  const ratingRaw = fm.rating != null ? Number(fm.rating) : null;
  const rating10 =
    ratingRaw != null && !Number.isNaN(ratingRaw)
      ? Math.min(10, Math.max(0, ratingRaw))
      : null;
  const rating5 = rating10 != null ? rating10 / 2 : null;
  const fullStars = rating5 != null ? Math.floor(rating5) : 0;
  const hasHalf = rating5 != null && rating5 - fullStars >= 0.5;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Facility Management</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{fm.name}</h3>
          {rating10 != null ? (
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
              <span className="text-sm text-gray-600 ml-1">
                {Number.isInteger(rating10) ? rating10 : rating10.toFixed(1)}/10
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-600">—/10</span>
          )}
        </div>
        {fm.description && (
          <p className="text-sm text-gray-600">{fm.description}</p>
        )}
      </div>
    </div>
  );
}
