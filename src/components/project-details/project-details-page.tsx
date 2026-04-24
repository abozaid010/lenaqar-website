'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/ui/back-button';
import type { ProjectViewModel } from '@/lib/projects/project-types';
import ProjectHeroGallery from './project-hero-gallery';
import ProjectHeaderSummary from './project-header-summary';
import ProjectLocationContext from './project-location-context';
import RelatedEntityLinks from './related-entity-links';
import ProjectContactCard from './project-contact-card';
import ProjectBreadcrumbs from './project-breadcrumbs';
import ProjectPaymentPlans from './project-payment-plans';
import ProjectPricingTable from './project-pricing-table';
import ProjectBuildingTypeGallery from './project-building-type-gallery';
import ProjectFacilityManagement from './project-facility-management';
import AddCompoundDialog from '@/components/ui/add-project-dialog';

interface ProjectDetailsPageProps {
  project: ProjectViewModel;
  rawProject?: Record<string, unknown>;
}

export default function ProjectDetailsPage({ project, rawProject }: ProjectDetailsPageProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const router = useRouter();

  const handleEdit = () => setShowEditDialog(true);

  const handleEditSaved = () => {
    setShowEditDialog(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Button - Part of content area */}
        <div className="mb-6">
          <BackButton fallbackRoute="/myProjects" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <ProjectHeroGallery images={project.galleryImages.length > 0 ? project.galleryImages : project.heroImages} isPrimary={project.isPrimary} />
            <ProjectHeaderSummary project={project} />

            <ProjectPricingTable project={project} />

            <ProjectPaymentPlans project={project} />
            <ProjectLocationContext project={project} />
            <ProjectBuildingTypeGallery project={project} />
            <ProjectFacilityManagement project={project} />
            <RelatedEntityLinks project={project} />
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              <div className="hidden lg:block">
                <ProjectContactCard project={project} onEdit={handleEdit} />
              </div>

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

      {/* Mobile Contact Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 px-4 py-3">
        <div className="flex gap-3">
          <button
            onClick={handleEdit}
            className="flex-1 py-2 border border-primary/40 text-primary rounded-lg text-sm font-medium"
          >
            Edit
          </button>
          <a
            href="tel:"
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Call
          </a>
        </div>
      </div>

      {/* Edit Dialog */}
      {showEditDialog && (
        <AddCompoundDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          compoundData={rawProject}
          clientId={project.clientId}
          onAdd={handleEditSaved}
          onEdit={() => {}}
          defaultCity={undefined}
          defaultDistrict={undefined}
        />
      )}
    </div>
  );
}
