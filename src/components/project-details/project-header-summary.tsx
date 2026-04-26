'use client';

import Link from 'next/link';
import { MapPin, Building, User, Tag, Calendar } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { ProjectHeaderSummaryProps } from '@/lib/projects/project-types';
import { useEffect, useMemo, useState } from 'react';
import { formatCityLabel, formatDistrictLabel } from '@/utils/formatters';

export default function ProjectHeaderSummary({ project }: ProjectHeaderSummaryProps) {
  const { t, locale } = useI18n();

  const [locationText, setLocationText] = useState<string>(project.locationLabel);

  const { cityRaw, districtRaw } = useMemo(() => {
    const parts = String(project.locationLabel || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return { cityRaw: parts[0] || '', districtRaw: parts[1] || '' };
  }, [project.locationLabel]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!cityRaw) {
          if (!cancelled) setLocationText(project.locationLabel);
          return;
        }
        const city = await formatCityLabel(cityRaw, locale);
        const district = districtRaw
          ? await formatDistrictLabel(districtRaw, cityRaw, locale)
          : '';
        const merged = district ? `${city}, ${district}` : city;
        if (!cancelled) setLocationText(merged || project.locationLabel);
      } catch {
        if (!cancelled) setLocationText(project.locationLabel);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [cityRaw, districtRaw, locale, project.locationLabel]);

  const developerName =
    locale === 'ar'
      ? ((project as any).developer_ar ||
          (project as any).developerAr ||
          project.developerName)
      : project.developerName;

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {project.title}
        </h1>

        {/* Developer and Location Links */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {developerName && (
            project.developerHref ? (
              <Link
                href={project.developerHref}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <User className="w-4 h-4" />
                {developerName}
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-gray-600">
                <User className="w-4 h-4" />
                {developerName}
              </span>
            )
          )}

          <span className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            {locationText}
          </span>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.totalUnits && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t?.projectPage?.totalUnits || 'Total Units'}</p>
              <p className="font-semibold text-gray-900">{project.totalUnits}</p>
            </div>
          </div>
        )}

        {project.deliveryDateLabel && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t?.projectPage?.delivery || 'Delivery'}</p>
              <p className="font-semibold text-gray-900">{project.deliveryDateLabel}</p>
            </div>
          </div>
        )}

        {project.status && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t?.projectPage?.status || 'Status'}</p>
              <p className="font-semibold text-gray-900 capitalize">{project.status}</p>
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      {project.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.badges.map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Pricing Information */}
      {(project.startingPrice || project.averagePricePerMeter) && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.startingPrice && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t?.projectPage?.startingPrice || 'Starting Price'}</p>
                <p className="text-2xl font-bold text-green-600">{project.startingPrice}</p>
              </div>
            )}
            {project.averagePricePerMeter && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t?.projectPage?.avgPricePerM2 || 'Avg Price / m²'}</p>
                <p className="text-2xl font-bold text-green-600">{project.averagePricePerMeter}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
