'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProjectViewModel } from '@/lib/projects/project-types';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  project: ProjectViewModel;
}

function TypeGallery({ label, urls }: { label: string; urls: string[] }) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  if (urls.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2 capitalize">
        {t?.projectBuildingTypeGallery?.buildingType || label.replace(/_/g, ' ')}
      </p>
      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 group">
        <Image src={urls[idx]} alt={label} fill className="object-cover" />
        {urls.length > 1 && (
          <>
            <button
              onClick={() => setIdx(p => (p === 0 ? urls.length - 1 : p - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={t?.common?.previous}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIdx(p => (p === urls.length - 1 ? 0 : p + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={t?.common?.next}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {t?.projectBuildingTypeGallery?.imageCounter || `${idx + 1}/${urls.length}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProjectBuildingTypeGallery({ project }: Props) {
  const { t } = useI18n();
  const entries = Object.entries(project.buildingTypeImages).filter(([, urls]) => urls.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{t?.projectBuildingTypeGallery?.unitTypeGalleries}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {entries.map(([type, urls]) => (
          <TypeGallery key={type} label={type} urls={urls} />
        ))}
      </div>
    </div>
  );
}
