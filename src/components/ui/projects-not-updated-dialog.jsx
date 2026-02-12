"use client";

import { AlertCircle, X, Loader2 } from "lucide-react";

export default function ProjectsNotUpdatedDialog({
  isOpen,
  projectsNotUpdated,
  selectedProjectsForDeletion,
  isDeletingProjects,
  t,
  locale,
  onClose,
  onToggleSelectAll,
  onToggleProject,
  onConfirmDelete,
}) {
  if (!isOpen || !projectsNotUpdated?.length) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[103] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between py-4 px-6 border-b gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isDeletingProjects}
            >
              {t.uploadExcel?.close || "Close"}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {t.uploadExcel?.projectsNotUpdatedTitle || "Projects not updated"}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeletingProjects || !selectedProjectsForDeletion.length}
              className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs"
            >
              {isDeletingProjects && <Loader2 className="animate-spin" size={14} />}
              <span>
                {t.uploadExcel?.deleteSelectedProjects ||
                  "Delete primary units for selected projects"}
              </span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-gray-700">
            {t.uploadExcel?.projectsNotUpdatedMessage ||
              "Some projects have existing primary units that were not updated by this import. You can delete primary units for selected projects to keep data in sync."}
          </p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-800">
              {t.uploadExcel?.projectsNotUpdatedListLabel || "Projects with old primary units"}
            </span>
            <button
              type="button"
              className="text-xs text-primary hover:underline disabled:opacity-40"
              disabled={projectsNotUpdated.length === 0}
              onClick={onToggleSelectAll}
            >
              {selectedProjectsForDeletion.length === projectsNotUpdated.length
                ? (t.uploadExcel?.deselectAll || "Deselect all")
                : (t.uploadExcel?.selectAll || "Select all")}
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[40vh] overflow-y-auto divide-y">
              {projectsNotUpdated.map((project) => {
                const checked = selectedProjectsForDeletion.includes(project.id);
                const name =
                  locale === "ar"
                    ? project.ar_name || project.en_name || project.id
                    : project.en_name || project.ar_name || project.id;
                const count =
                  typeof project.units_count === "number"
                    ? project.units_count
                    : null;
                const displayName = count !== null ? `${name} (${count})` : name;

                return (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={checked}
                      onChange={(e) => onToggleProject(project.id, e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-800 break-all">
                      {displayName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {t.uploadExcel?.projectsNotUpdatedHint ||
              "Only primary units (isPrimary = true) will be deleted. Secondary units will be kept."}
          </p>
        </div>
      </div>
    </div>
  );
}

