"use client";

import {
  addNewPhase,
  updatePhase,
} from "@/components/services/serviceFetching";
import Dialog from "@/components/ui/Dialog";
import ImageUploader from "@/components/ui/inputs/image-uploader";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import SingleImageUploader from "./inputs/single-image-uploader";

export default function AddPhseDilog({
  isOpen,
  onClose,
  onAdd,
  phaseData,
  projectId,
}) {
  const { t } = useI18n();

  // Determine edit mode based on compoundData
  const editMode = !!(phaseData && phaseData.id);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMasterPlanUploading, setIsMasterPlanUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    id: uuidv4() || phaseData?.id,
    name: phaseData?.name || "",
    description: phaseData?.description || "",
    master_plan: phaseData?.master_plan || { url: null, fileId: null },
    updated_at: new Date().toISOString(),
    images: phaseData?.images || [],
  });

  // Add effect to update form data when phaseData changes
  useEffect(() => {
    if (phaseData) {
      setFormData({
        id: phaseData.id,
        name: phaseData.name,
        description: phaseData.description,
        master_plan: phaseData.master_plan || { url: null, fileId: null },
        updated_at: new Date().toISOString(),
        images: phaseData.images || [],
      });
    }
  }, [phaseData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Phase name is required";
      toast.error("Phase name is required");
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editMode) {
        const formDataToUpdate = {
          name: formData.name,
          master_plan: formData.master_plan,
          description: formData.description,
          updated_at: new Date().toISOString(),
          images: formData.images,
        };

        const res = await updatePhase(
          formDataToUpdate,
          projectId,
          phaseData.id
        );
        if (res.code === 200) {
          toast.success(
            t.phasee.updatePhasesuccess || "Phase updated successfully"
          );
          onAdd({
            name: res.data?.name,
            id: res.data?.id,
            description: res.data?.description,
            master_plan: res.data?.master_plan,
            images: res.data?.images || [],
          });

          onClose();
        } else {
          toast.error(t.phasee.updatePhaseFaile || "Failed to update phase");
        }
      } else {
        const res = await addNewPhase(formData, projectId);
        if (res.code === 200) {
          toast.success(t.addPhaseSuccess);
          onAdd({
            name: res.data?.name,
            id: res.data?.id,
            master_plan: res.data?.master_plan,
            description: res.data?.description,
            images: res.data?.images || [],
          });

          setFormData({
            id: uuidv4(),
            name: "",
            description: "",
            master_plan: { url: null, fileId: null },
            updated_at: new Date().toISOString(),
          });

          onClose();
        } else {
          toast.error(t.addPhaseFailed);
        }
      }
    } catch (error) {
      toast.error(
        editMode
          ? t.updatePhaseFailed || "Failed to update phase"
          : t.addPhaseFailed
      );
      setErrors({
        submit: editMode
          ? t.updatePhaseFailed || "Failed to update phase"
          : t.addPhaseFailed,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t.phasee?.addnew || "Add New Project"}
    >
      <div>
        <div className="space-y-2">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.phaseName || "Phase Name"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={editMode}
              className={`block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                editMode ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.description || "Description"}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                t.formLabels?.descriptionPlaceholder ||
                "Enter phase description..."
              }
            />
          </div>

          {/* Master Plan Image */}
          <SingleImageUploader
            label={t.formLabels.masterPlanImage || "Master Plan Image"}
            value={formData.master_plan.url}
            imageId={formData.master_plan.fileId}
            onChange={(url, id) =>
              setFormData((prev) => ({
                ...prev,
                master_plan: { url, fileId: id },
              }))
            }
            disabled={isMasterPlanUploading || isSubmitting}
            isUploading={isMasterPlanUploading}
            setIsUploading={setIsMasterPlanUploading}
          />

          {/* Phase Images */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.phaseImage || "Phase Images"} {""}
              <span className="text-xs font-normal text-gray-500">
                ({formData.images?.length || 0} / 8)
              </span>
            </div>
            <ImageUploader
              maxImages={8}
              initialImages={editMode ? phaseData?.images || [] : []}
              onImagesChange={(images) =>
                setFormData((prev) => ({ ...prev, images }))
              }
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {t.buttons?.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-1.5 w-42 bg-primary rounded-md text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isSubmitting || isUploading || isMasterPlanUploading
                  ? "pointer-events-none opacity-80"
                  : "hover:bg-primary/90"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  {editMode ? t.updating : t.buttons?.saving || "Saving..."}
                </div>
              ) : editMode ? (
                t.updatePhase
              ) : (
                t.addPhase
              )}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
