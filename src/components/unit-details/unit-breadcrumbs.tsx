import Link from 'next/link';
import { ChevronRight, Home, Building } from 'lucide-react';
import type { UnitBreadcrumbsProps } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

export default function UnitBreadcrumbs({ unit }: UnitBreadcrumbsProps) {
  const { translate } = useI18n();
  const breadcrumbs = [];

  // Home
  breadcrumbs.push({
    label: 'Home',
    href: '/',
    icon: Home,
  });

  // Units/Search Results
  breadcrumbs.push({
    label: 'Properties',
    href: '/properties',
    icon: null,
  });

  // Project (if available and has link)
  if (unit.projectHref && unit.projectName) {
    breadcrumbs.push({
      label: unit.projectName,
      href: unit.projectHref,
      icon: null,
    });
  } else if (unit.projectName) {
    breadcrumbs.push({
      label: unit.projectName,
      href: null,
      icon: Building,
    });
  }

  // Current unit (non-clickable)
  const buildingTypeLabel = unit.buildingType
    ? translate(`buildingTypes.${String(unit.buildingType).toLowerCase()}`, unit.buildingType)
    : null;
  const currentTitle = unit.title || `${buildingTypeLabel || 'Property'} Details`;
  breadcrumbs.push({
    label: currentTitle.length > 30 ? currentTitle.substring(0, 30) + '...' : currentTitle,
    href: null,
    icon: null,
  });

  return (
    <nav className="flex items-center space-x-2 text-sm overflow-x-auto">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const IconComponent = crumb.icon;

        return (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
                {crumb.label}
              </Link>
            ) : (
              <span className={`flex items-center gap-1 whitespace-nowrap ${
                isLast ? 'text-gray-900 font-medium' : 'text-gray-600'
              }`}>
                {IconComponent && <IconComponent className="w-4 h-4" />}
                {crumb.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
