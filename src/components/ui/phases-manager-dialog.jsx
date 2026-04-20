"use client";

import Dialog from "@/components/ui/Dialog";
import ImageWithLoader from "@/components/ui/image-with-loader";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { useI18n } from "@/context/translate-api";
import { deletePhase } from "@/utils/api";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { Plus, Clock } from "lucide-react";
import { EditButton, DeleteButton } from "@/components/ui/action-button";
import { useState } from "react";
import toast from "react-hot-toast";

export default function PhasesManagerDialog({
  isOpen,
  onClose,
  project,
  canEdit = true,
  onProjectUpdate = () => {},
}) {
  const { t, locale } = useI18n();

  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [phaseToEdit, setPhaseToEdit] = useState(null);
  const [phaseToDelete, setPhaseToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!project) return null;

  const phases = Array.isArray(project.phases) ? project.phases : [];

  const handlePhaseSaved = (phase) => {
    const updatedPhases = [...phases];
    const idx = updatedPhases.findIndex((p) => p.id === phase.id);
    if (idx !== -1) {
      updatedPhases[idx] = phase;
    } else {
      updatedPhases.push(phase);
    }
    onProjectUpdate({ ...project, phases: updatedPhases });
    setPhaseDialogOpen(false);
    setPhaseToEdit(null);
  };

  const handleConfirmDelete = async () => {
    if (!phaseToDelete) return;
    try {
      const res = await deletePhase(project.id, phaseToDelete.id);
      if (res?.code === 200) {
        toast.success(t.phasee?.delete || "Phase deleted");
        const updatedPhases = phases.filter((p) => p.id !== phaseToDelete.id);
        onProjectUpdate({ ...project, phases: updatedPhases });
      } else {
        toast.error(t.failedPhase || "Failed to delete phase");
      }
    } catch {
      toast.error(t.failedPhase || "Failed to delete phase");
    } finally {
      setDeleteDialogOpen(false);
      setPhaseToDelete(null);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          (locale === "ar" ? "مراحل المشروع" : "Project Phases") +
          (project
            ? ` · ${locale === "ar" ? project.ar_name || project.en_name : project.en_name || project.ar_name || ""}`
            : "")
        }
        bodyClassName="p-0 overflow-y-auto bg-gray-50 flex-1 min-h-0"
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-5">
          {canEdit && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  setPhaseToEdit(null);
                  setPhaseDialogOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
              >
                <Plus size={16} />
                {t.phasee?.addnew || (locale === "ar" ? "إضافة مرحلة" : "Add new phase")}
              </button>
            </div>
          )}

          {phases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-12">
              <Clock className="w-12 h-12 text-primary/70" strokeWidth={1.5} />
              <p className="mt-3 text-base font-medium text-gray-600">
                {t.noPhsesProject || (locale === "ar" ? "لا توجد مراحل لهذا المشروع" : "No phases for this project")}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {phases.map((phase) => {
                const thumbUrl =
                  getDisplayImageUrl(phase?.master_plan?.url) ||
                  (Array.isArray(phase?.images) && phase.images.length > 0
                    ? getDisplayImageUrl(phase.images[0]?.url)
                    : null) ||
                  "/images/defaultImage.jpg";
                return (
                  <li
                    key={phase.id}
                    className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      <ImageWithLoader
                        src={thumbUrl}
                        alt={phase.name || "Phase"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        priority={false}
                        loadingVariant="minimal"
                      />
                      {canEdit && (
                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <EditButton
                            size="sm"
                            className="shadow-sm"
                            title={t.buttons?.edit || "Edit"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhaseToEdit(phase);
                              setPhaseDialogOpen(true);
                            }}
                          />
                          <DeleteButton
                            size="sm"
                            className="shadow-sm"
                            title={t.buttons?.delete || "Delete"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhaseToDelete(phase);
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="line-clamp-1 text-sm font-semibold text-gray-900">
                        {phase.name}
                      </h4>
                      {phase.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Dialog>

      {phaseDialogOpen && (
        <AddPhaseDialog
          isOpen={phaseDialogOpen}
          onClose={() => {
            setPhaseDialogOpen(false);
            setPhaseToEdit(null);
          }}
          phaseData={phaseToEdit}
          onAdd={handlePhaseSaved}
          projectId={project.id}
        />
      )}

      {deleteDialogOpen && phaseToDelete && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setPhaseToDelete(null);
          }}
          confirmLabel={t.deleteButton}
          cancelLabel={t.cancelButton}
          onConfirm={handleConfirmDelete}
          title={t.deletePhaseTitel || "Delete phase"}
          message={`${t.sureDelet || "Are you sure you want to delete"} "${phaseToDelete?.name}"? ${t.actionDelet || "This action cannot be undone."}`}
        />
      )}
    </>
  );
}
