import Link from 'next/link';
import { ChevronRight, Home, FolderOpen } from 'lucide-react';
import type { ProjectBreadcrumbsProps } from '@/lib/projects/project-types';

export default function ProjectBreadcrumbs({ project }: ProjectBreadcrumbsProps) {
  const breadcrumbs = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'My Projects',
      href: '/myProjects',
      icon: FolderOpen
    },
    {
      name: project.title,
      href: null, // Current page, no link
      icon: null
    }
  ];

  return (
    <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
          )}
          
          {breadcrumb.href ? (
            <Link
              href={breadcrumb.href}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
              <span>{breadcrumb.name}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-gray-900 font-medium">
              {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
              <span>{breadcrumb.name}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
