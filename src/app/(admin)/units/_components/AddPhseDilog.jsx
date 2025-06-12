"use client";

import {
  addNewPhase,
  deleteImage,
  updatePhase,
  uploadImages,
} from "@/components/services/serviceFetching";
import Dialog from "@/components/ui/Dialog";
import ImageUploader from "@/components/ui/image-uploader";
import { useI18n } from "@/context/translate-api";
import { compressImage } from "@/utils/imageCompression";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

export default function AddPhseDilog({
  isOpen,
  onClose,
  onAdd,
  projectId,
  editMode,
  phaseData,
  projectIdPhase,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    id: uuidv4() || phaseData?.id,
    name: phaseData?.name || "",
    description: phaseData?.description || "",
    master_plan: phaseData?.master_plan || "",
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
        master_plan: phaseData.master_plan || "",
        updated_at: new Date().toISOString(),
        images: phaseData.images || [],
      });

      // Only set selected image if master_plan exists and is not empty
      if (phaseData.master_plan && phaseData.master_plan.trim() !== "") {
        setSelectedImage({
          name: "Existing Image",
          preview: phaseData.master_plan,
        });
      } else {
        setSelectedImage(null);
      }
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

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];

    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB. Please select a smaller file.");
      return;
    }
    if (
      file &&
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      toast.error(
        "Invalid file type. Please select a JPEG, PNG, or WEBP image."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        name: file.name,
        preview: reader.result,
      });
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);

      const compressedFile = await compressImage(file);

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", compressedFile);

      const res = await uploadImages(formDataToUpload);

      setFormData((prev) => ({
        ...prev,
        master_plan: res.url,
      }));
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to compress image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation();

    if (selectedImage.imageId) {
      try {
        await deleteImage(uploadedImageId);
        toast.success(
          t.toasts?.imageRemoved ||
            "Image removed successfully from the server!"
        );
        setUploadedImageId(null);
      } catch (error) {
        toast.error(
          t.toasts?.imageRemoveFailed ||
            "Failed to remove image from the server. Please try again."
        );
        return;
      }
    }

    setSelectedImage(null);
    setFormData((prev) => ({
      ...prev,
      master_plan: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
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
          master_plan: selectedImage ? formData.master_plan : "",
          description: formData.description,
          updated_at: new Date().toISOString(),
          images: formData.images,
        };
        console.log("formDataToUpdate", formDataToUpdate);
        const res = await updatePhase(
          formDataToUpdate,
          projectIdPhase,
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
          router.refresh();
          onClose();
        } else {
          toast.error(t.phasee.updatePhaseFaile || "Failed to update phase");
        }
      } else {
        const res = await addNewPhase(formData, projectId);
        if (res.code === 200) {
          toast.success(t.addPhaseSuccess);
          console.log("res", res.data, "########");
          onAdd({
            name: res.data?.name,
            id: res.data?.id,
            master_plan: res.data?.master_plan,
          });
          router.refresh();

          setFormData({
            id: uuidv4(),
            name: "",
            description: "",
            master_plan: "",
            updated_at: new Date().toISOString(),
          });

          if (fileInputRef.current) {
            fileInputRef.current.value = null;
          }
          setSelectedImage(null);
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.masterPlanImage || "Master Plan Image"}
            </label>
            <div className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <div
                onClick={() => fileInputRef.current.click()}
                className="flex flex-col items-center justify-center"
              >
                {selectedImage || formData.master_plan ? (
                  <div className="relative group min-h-[200px] aspect-square flex flex-col gap-1 items-center justify-center">
                    <div className="relative flex-1 w-full h-full">
                      <Image
                        fill
                        priority={true}
                        src={selectedImage?.preview}
                        alt={`Image ${selectedImage.name}`}
                        className="w-full h-full object-cover rounded-md"
                      />

                      {isUploading && (
                        <div
                          className={`absolute inset-0 flex items-center justify-center rounded-md bg-black/50`}
                        >
                          <svg
                            className="animate-spin h-8 w-8 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}

                      {!isUploading && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}

                      {!isUploading && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {selectedImage.name}
                    </div>
                  </div>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-base text-gray-700 mb-2">
                      {t.formLabels?.dragDropImage ||
                        "Click or drag and drop an image here"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.formLabels?.supportedFormats ||
                        "Supported formats: JPG, PNG, WEBP (Max 5MB each)"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

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
                isSubmitting || isUploading
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
