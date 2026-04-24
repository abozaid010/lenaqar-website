'use client';

import { PhoneCall, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectViewModel } from '@/lib/projects/project-types';
import { deleteProject } from '@/utils/api';
import toast from 'react-hot-toast';

interface Props {
  project: ProjectViewModel;
  onEdit?: () => void;
}

export default function ProjectContactCard({ project, onEdit }: Props) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const clientId = project.clientId || 'public';

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
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Interested in this project?</h3>
        <p className="text-sm text-gray-600">Get in touch with the developer to learn more</p>
      </div>

      {project.developerName && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Developer</div>
          <div className="text-sm font-medium text-gray-900">{project.developerName}</div>
        </div>
      )}

      {/* Contact CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:`}
          className="bg-blue-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <PhoneCall className="w-4 h-4" />
          Call
        </a>
        <a
          href={`https://wa.me/`}
          target="_blank"
          rel="noreferrer"
          className="bg-green-600 text-white rounded-lg py-2 px-3 font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>

      {/* Admin Actions */}
      <div className="border-t pt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onEdit}
          className="border border-primary/40 text-primary rounded-lg py-2 px-3 font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="border border-red-300 text-red-600 rounded-lg py-2 px-3 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
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
