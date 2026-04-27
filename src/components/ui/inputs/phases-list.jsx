"use client";

import { useI18n } from "@/hooks/useI18n";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import Image from "next/image";

export default function PhasesList({ phases = [], onChange, error, required = false, projectId = null }) {
  const { t, locale } = useI18n();
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [phaseToEdit, setPhaseToEdit] = useState(null);

  const handleAddPhase = () => {
    setPhaseToEdit(null);
    setPhaseDialogOpen(true);
  };

  const handleEditPhase = (phase) => {
    setPhaseToEdit(phase);
    setPhaseDialogOpen(true);
  };

  const handleDeletePhase = (index) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    onChange(updatedPhases);
  };

  const handlePhaseSaved = (phase) => {
    let updatedPhases;
    const idx = phases.findIndex((p) => p.id === phase.id);
    if (idx !== -1) {
      updatedPhases = [...phases];
      updatedPhases[idx] = phase;
    } else {
      updatedPhases = [...phases, phase];
    }
    onChange(updatedPhases);
    setPhaseDialogOpen(false);
    setPhaseToEdit(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t?.projectPage?.phases || "Project Phases"}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <p className="text-xs text-gray-500">
            {locale === "ar"
              ? "أضف مراحل المشروع مع الصور والوصف"
              : "Add project phases with images and descriptions"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddPhase}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
        >
          <Plus size={16} />
          {locale === "ar" ? "إضافة مرحلة" : "Add Phase"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {phases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8">
          <p className="text-sm text-gray-500">
            {locale === "ar"
              ? "لا توجد مراحل بعد. أضف مرحلة للبدء."
              : "No phases yet. Add a phase to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phases.map((phase, index) => (
            <div
              key={phase.id || index}
              className="group relative rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3">
                {phase.master_plan?.url || phase.images?.[0]?.url ? (
                  <Image
                    src={phase.master_plan?.url || phase.images[0].url}
                    alt={phase.name || "Phase"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <span className="text-2xl font-bold text-gray-300">
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>

              <h4 className="font-medium text-gray-900 text-sm mb-1">
                {phase.name || (locale === "ar" ? "مرحلة بدون اسم" : "Unnamed Phase")}
              </h4>

              {phase.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {phase.description}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleEditPhase(phase)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 size={12} />
                  {locale === "ar" ? "تعديل" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhase(index)}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={12} />
                  {locale === "ar" ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {phaseDialogOpen && (
        <AddPhaseDialog
          isOpen={phaseDialogOpen}
          onClose={() => {
            setPhaseDialogOpen(false);
            setPhaseToEdit(null);
          }}
          onAdd={handlePhaseSaved}
          phaseData={phaseToEdit}
          projectId={projectId}
        />
      )}
    </div>
  );
}
