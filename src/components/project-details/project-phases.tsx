'use client';

import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import Image from 'next/image';
import type { ProjectViewModel, RawProject } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
  rawProject?: Record<string, unknown>;
}

export default function ProjectPhases({ project, rawProject }: Props) {
  const { t, locale } = useI18n();
  const isArabic = locale === 'ar';
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  // Get raw phases data which contains images and descriptions
  const rawPhases = rawProject?.phases as RawProject['phases'];

  if (!rawPhases || rawPhases.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {isArabic ? 'مراحل المشروع' : 'Project Phases'}
      </h2>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rawPhases.map((phase, index) => {
          const isPhaseObject = typeof phase !== 'string';
          const phaseImage = isPhaseObject ? (phase.master_plan?.url || phase.images?.[0]?.url) : null;
          const phaseName = isPhaseObject ? phase.name : phase;
          const phaseDescription = isPhaseObject ? phase.description : undefined;
          const phaseImages = isPhaseObject ? phase.images : [];
          const phaseId = isPhaseObject ? phase.id : null;

          return (
            <div
              key={phaseId || index}
              className="group cursor-pointer"
              onClick={() => setSelectedPhase(selectedPhase === index ? null : index)}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                {phaseImage ? (
                  <Image
                    src={phaseImage}
                    alt={phaseName || (isArabic ? 'مرحلة' : 'Phase')}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <span className="text-4xl font-bold text-gray-300">
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">
                {phaseName || (isArabic ? 'مرحلة بدون اسم' : 'Unnamed Phase')}
              </h3>

              {phaseDescription && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {phaseDescription}
                </p>
              )}

              {phaseImages && phaseImages.length > 1 && (
                <p className="text-xs text-gray-500 mt-2">
                  {isArabic ? `${phaseImages.length} صور` : `${phaseImages.length} images`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded View for Selected Phase */}
      {selectedPhase !== null && rawPhases[selectedPhase] && (
        <div className="mt-8 pt-6 border-t">
          {(() => {
            const phase = rawPhases[selectedPhase];
            const phaseName = typeof phase === 'string' ? phase : phase.name;
            const phaseDescription = typeof phase === 'string' ? undefined : phase.description;
            const phaseImages = typeof phase === 'string' ? [] : phase.images || [];

            return (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {phaseName}
                </h3>

                {phaseDescription && (
                  <p className="text-gray-700 mb-4">
                    {phaseDescription}
                  </p>
                )}

                {/* Additional Images Gallery */}
                {phaseImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {phaseImages.map((img, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={img.url}
                          alt={`${phaseName} - ${imgIndex + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
