'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import type { ProjectBreadcrumbsProps } from '@/lib/projects/project-types';

export default function ProjectBreadcrumbs({ project }: ProjectBreadcrumbsProps) {
  const router = useRouter();

  const handleBack = () => {
    // Smart navigation: go back to projects list or use browser history
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/myProjects');
    }
  };

  return (
    <div className="flex items-center justify-between h-16">
      {/* Back Button - Takes left space */}
      <button
        onClick={handleBack}
        className="group flex items-center gap-3 px-4 py-2 h-10 bg-white border border-gray-200 rounded-lg hover:border-primary/40 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <ArrowLeft 
          size={20} 
          className="text-gray-600 group-hover:text-primary transition-colors duration-200 shrink-0" 
        />
        <span className="text-sm font-semibold text-gray-900">Back</span>
      </button>

      {/* Current Project Info - Takes center space */}
      <div className="flex-1 mx-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
            {project.title}
          </h1>
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        </div>
      </div>

      {/* Empty space on right for balance */}
      <div className="w-32"></div>
    </div>
  );
}
