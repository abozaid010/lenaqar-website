'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Calendar, 
  Phone, 
  MessageCircle, 
  MapPin,
  User,
  ChevronRight,
  Image as ImageIcon,
  Share2,
  Heart,
  Home
} from 'lucide-react';
import type { ProjectViewModel } from '@/lib/projects/project-types';
import ProjectHeroGallery from './project-hero-gallery';
import ProjectHeaderSummary from './project-header-summary';
import ProjectQuickFacts from './project-quick-facts';
import ProjectSpecifications from './project-specifications';
import ProjectLocationContext from './project-location-context';
import ProjectUnitsSection from './project-units-section';
import RelatedEntityLinks from './related-entity-links';
import ProjectInquiryCard from './project-inquiry-card';
import ProjectStickyActionBar from './project-sticky-action-bar';
import ProjectBreadcrumbs from './project-breadcrumbs';

interface ProjectDetailsPageProps {
  project: ProjectViewModel;
}

export default function ProjectDetailsPage({ project }: ProjectDetailsPageProps) {
  const [showMobileActionBar, setShowMobileActionBar] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ProjectBreadcrumbs project={project} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Gallery */}
            <ProjectHeroGallery images={project.heroImages} isPrimary={project.isPrimary} />

            {/* Header Summary */}
            <ProjectHeaderSummary project={project} />

            {/* Quick Facts */}
            {project.quickFacts.length > 0 && (
              <ProjectQuickFacts facts={project.quickFacts} />
            )}

            {/* Specifications */}
            {project.specs.length > 0 && (
              <ProjectSpecifications specs={project.specs} />
            )}

            {/* Location and Context */}
            <ProjectLocationContext project={project} />

            {/* Units Section */}
            <ProjectUnitsSection project={project} />

            {/* Related Navigation */}
            <RelatedEntityLinks project={project} />
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Sticky Inquiry Card - Desktop Only */}
              <div className="hidden lg:block">
                <ProjectInquiryCard project={project} />
              </div>

              {/* Trust/Metadata */}
              {project.trustItems.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
                  <div className="space-y-3">
                    {project.trustItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <ProjectStickyActionBar project={project} />
      </div>
    </div>
  );
}
