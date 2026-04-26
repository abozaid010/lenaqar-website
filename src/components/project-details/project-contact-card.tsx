'use client';

import { PhoneCall, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectViewModel } from '@/lib/projects/project-types';
import { deleteProject } from '@/utils/api';
import toast from 'react-hot-toast';
import { useI18n } from '@/hooks/useI18n';
import { useModuleActions } from '@/hooks/useModuleActions';
import { contactInfo } from '@/lib/contact-info';
import { LenaCookiesManager } from '@/lib/LenaCookiesManager';

interface Props {
  project: ProjectViewModel;
  onEdit?: () => void;
}

type ContactData = {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  type: 'Owner' | 'Developer' | 'Client' | null;
} | null;

export default function ProjectContactCard({ project, onEdit }: Props) {
  const { t, translate, locale } = useI18n();
  const projectsActions = useModuleActions("projects");
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contactData, setContactData] = useState<ContactData>(null);
  const [contactLoading, setContactLoading] = useState(true);

  const clientId = project.clientId || 'public';
  const canEditProject = projectsActions.canEdit;
  const canDeleteProject = projectsActions.canDelete;
  const canShowAdminActions = canEditProject || canDeleteProject;

  const callLabel =
    translate('buttons.call', t?.buttons?.call) || (locale === 'ar' ? 'اتصال' : 'Call');
  const whatsappLabel =
    translate('buttons.whatsapp', t?.buttons?.whatsapp) || (locale === 'ar' ? 'واتساب' : 'WhatsApp');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setContactLoading(true);
      try {
        const currentClientId = LenaCookiesManager.getClientId() || null;
        // Project details always use developer as primary contact (same as a primary unit).
        const contact = await contactInfo.get_contact_info(
          {
            clientId: project.clientId ?? null,
            developerId: project.developerId ?? null,
            isPrimary: true,
            ownerName: null,
            ownerMobile: null,
            developerName: project.developerName ?? null,
          },
          currentClientId
        );
        if (!cancelled) setContactData(contact);
      } catch (e) {
        console.error('Error loading project contact info:', e);
        if (!cancelled) {
          setContactData({
            name: null,
            phone: null,
            whatsapp: null,
            type: null,
          });
        }
      } finally {
        if (!cancelled) setContactLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [project.id, project.clientId, project.developerId, project.developerName]);

  const handleCall = useCallback(() => {
    const phone = contactData?.phone;
    if (phone) window.open(`tel:${phone}`, '_blank');
  }, [contactData?.phone]);

  const handleWhatsApp = useCallback(() => {
    const wa = contactData?.whatsapp;
    if (wa) {
      const clean = wa.replace(/[^\d]/g, '');
      window.open(`https://wa.me/${clean}`, '_blank');
    }
  }, [contactData?.whatsapp]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteProject(project.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Project deleted successfully');
        router.push(`/${clientId}/myProjects`);
      }
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{t?.unitInquiry?.projectInterestedTitle}</h3>
        <p className="text-sm text-gray-600">{t?.unitInquiry?.projectInterestedSubtitle}</p>
      </div>

      {project.developerName && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">
            {translate("projectContact.developerLabel")}
          </div>
          <div className="text-sm font-medium text-gray-900">{project.developerName}</div>
        </div>
      )}

      {contactLoading && (
        <div className="bg-gray-50 rounded-lg p-3 text-center text-xs text-gray-600">
          {translate('common.loading', 'Loading contact information...')}
        </div>
      )}

      {!contactLoading && (contactData?.phone || contactData?.whatsapp) ? (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">
            {contactData?.type
              ? `${translate("projectContact.contactLabel")} (${translate(
                  `projectContact.contactType.${String(contactData.type).toLowerCase()}`
                )})`
              : translate("projectContact.contactLabel")}
          </div>
          {contactData?.name && (
            <div className="text-sm font-medium text-gray-900">{contactData.name}</div>
          )}
          {contactData?.phone && (
            <div className="text-xs text-gray-500 mt-1">{contactData.phone}</div>
          )}
        </div>
      ) : null}

      {/* Contact CTAs — developer phone/WhatsApp from get_contact_info (primary) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleCall}
          disabled={contactLoading || !contactData?.phone}
          className="bg-blue-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          title={contactData?.phone || translate('unitInquiry.phoneUnavailable', 'Phone number not available')}
        >
          <PhoneCall className="w-4 h-4" />
          {callLabel}
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          disabled={contactLoading || !contactData?.whatsapp}
          className="bg-green-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          title={contactData?.whatsapp || translate('unitInquiry.whatsappUnavailable', 'WhatsApp not available')}
        >
          <MessageCircle className="w-4 h-4" />
          {whatsappLabel}
        </button>
      </div>

      {/* Admin Actions */}
      {canShowAdminActions && (
        <div
          className={`border-t pt-4 grid gap-3 ${
            canEditProject && canDeleteProject ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {canEditProject ? (
            <button
              onClick={onEdit}
              className="border border-primary/40 text-primary rounded-lg py-2 px-3 font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Edit className="w-4 h-4" />
              {t?.buttons?.edit}
            </button>
          ) : null}
          {canDeleteProject ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-red-300 text-red-600 rounded-lg py-2 px-3 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {t?.buttons?.delete}
            </button>
          ) : null}
        </div>
      )}

      {/* Delete confirmation */}
      {canDeleteProject && showDeleteConfirm && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
          <p className="text-sm text-red-800 font-medium">Delete &ldquo;{project.title}&rdquo;?</p>
          <p className="text-xs text-red-600">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
