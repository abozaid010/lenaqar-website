"use client";

import {
  addCompound,
  deleteImage,
  updatecompound,
  uploadImages,
} from "@/components/services/serviceFetching";
import Dialog from "@/components/ui/Dialog";
import { useI18n } from "@/context/translate-api";
import { compressImage } from "@/utils/imageCompression";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import AddDeveloperDialog from "./add-developer-dialog";

export default function AddCompoundDialog({
  clientId,
  isOpen,
  onClose,
  compoundData,
  editMode,
  onAdd,
  developers = [],
  setDevelopers,
  Egypt_cities,
  defaultCity,
  defaultDistrict,
}) {
  const { t } = useI18n();
  const ar = Cookies.get("lang");
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);

  const [formData, setFormData] = useState({
    name: compoundData?.name || "",
    description: compoundData?.description || "",
    developer_name: compoundData?.developer_name || "",
    city: defaultCity || "",
    country: "Egypt",
    district: defaultDistrict || "",
    area: "",
    gated: false,
    video_url: compoundData?.video_url || "",
    google_map_link: compoundData?.google_map_link || "",
    master_plan: compoundData?.master_plan || "",
    client_id: clientId || "",
  });

  useEffect(() => {
    if (isOpen) {
      // When the dialog is opening
      if (editMode && compoundData) {
        // Load existing data for editing
        setFormData({
          name: compoundData.name || "",
          description: compoundData.description || "",
          developer_name: compoundData.developer_name || "",
          city: compoundData.city || defaultCity || "", // Still use default if compound data is missing city
          country: compoundData.country || "Egypt",
          district: compoundData.district || defaultDistrict || "", // Still use default if compound data is missing district
          area: compoundData.area || "",
          gated: compoundData.gated || false,
          video_url: compoundData.video_url || "",
          google_map_link: compoundData.google_map_link || "",
          master_plan: compoundData.master_plan || "",
          client_id: compoundData.client_id || clientId || "",
        });
        // Set selected image for existing master plan
        if (compoundData.master_plan) {
          setSelectedImage({
            name: "existing_image",
            preview: compoundData.master_plan,
          });
        } else {
          setSelectedImage(null);
        }
      } else if (!editMode) {
        // Reset form with defaults for adding
        setFormData({
          name: "",
          description: "",
          developer_name: "",
          city: defaultCity || "",
          country: "Egypt",
          district: defaultDistrict || "",
          area: "",
          gated: false,
          video_url: "",
          google_map_link: "",
          master_plan: "",
          client_id: clientId || "",
        });
        // Clear selected image and file input
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
      }
      // Clear errors when opening in either mode
      setErrors({});
    } else {
      // When the dialog is closing, reset form and clear errors completely
      setFormData({
        name: "",
        description: "",
        developer_name: "",
        city: defaultCity || "", // Reset to defaults on close as well
        country: "Egypt",
        district: defaultDistrict || "",
        area: "",
        gated: false,
        video_url: "",
        google_map_link: "",
        master_plan: "",
        client_id: clientId || "",
      });
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      setErrors({});
    }
  }, [isOpen, editMode, compoundData, defaultCity, defaultDistrict, clientId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Add validation for district selection
    if (name === "district" && !formData.city) {
      toast.error(
        ar === "ar"
          ? "الرجاء اختيار المدينة أولاً"
          : "Please select a city first"
      );
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error for this field when user types
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
      newErrors.name =
        t.formValidation?.compoundNameRequired || "Compound name is required";
      toast.error(
        t.formValidation?.compoundNameRequired || "Compound name is required"
      );
    }

    if (!formData.city.trim()) {
      newErrors.city = t.formValidation?.cityRequired || "City is required";
      toast.error(t.formValidation?.cityRequired || "City is required");
    }

    if (!formData.country.trim()) {
      newErrors.country =
        t.formValidation?.countryRequired || "Country is required";
      toast.error(t.formValidation?.countryRequired || "Country is required");
    }

    if (!formData.district.trim()) {
      newErrors.district =
        t.formValidation?.districtRequired || "District is required";
      toast.error(t.formValidation?.districtRequired || "District is required");
    }

    if (formData.area && (isNaN(formData.area) || Number(formData.area) <= 0)) {
      newErrors.area =
        t.formValidation?.areaPositive || "Area must be a positive number";
      toast.error(
        t.formValidation?.areaPositive || "Area must be a positive number"
      );
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

    // Clear the selected image and reset the master_plan field
    setSelectedImage(null);
    setFormData((prev) => ({
      ...prev,
      master_plan: "",
    }));

    // Reset the file input value to ensure the onChange event is triggered
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
      let submissionData;

      if (editMode) {
        // Only include editable fields in edit mode
        submissionData = {
          description: formData.description,
          master_plan: formData.master_plan,
          video_url: formData.video_url,
        };
      } else {
        // Include all relevant fields in add mode
        submissionData = {
          ...formData,
          area: Number(formData.area),
        };
      }

      let res;
      if (!editMode) {
        // Add new compound
        res = await addCompound(submissionData);
        // Call onAdd after successful add to notify parent (ProjectGrid)
        if (res?.data?.id) {
          // Check if ID is returned on successful add
          onAdd({
            name: res.data?.name,
            id: res.data?.id,
            ...submissionData, // Include other form data if needed by parent
          });
        }
      } else {
        // Update compound
        res = await updatecompound(submissionData, compoundData.id);
        // Call onAdd after successful update to notify parent (ProjectGrid)
        // Pass the updated data structure expected by handleProjectUpdate
        onAdd({
          name: formData.name,
          id: compoundData.id,
          ...submissionData,
        });
      }

      // If we reach here, the API call was successful (no error was thrown)
      toast.success(
        editMode
          ? t.compoundUpdated || "project updated successfully!"
          : t.compoundAdded || "project added successfully!"
      );

      // Reset form and clear image only for new compounds after success
      if (!editMode) {
        setFormData({
          name: "",
          description: "",
          developer_name: "",
          city: defaultCity || "",
          country: "Egypt",
          district: defaultDistrict || "",
          area: "",
          gated: false,
          video_url: "",
          google_map_link: "",
          master_plan: "",
          client_id: clientId || "ai",
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        setSelectedImage(null);
      }

      // Close dialog on success for both add and edit
      onClose();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(
        editMode
          ? t.toasts?.compoundUpdateFailed ||
              "Failed to update compound. Please try again."
          : t.toasts?.compoundAddFailed ||
              "Failed to add compound. Please try again."
      );
      setErrors({
        // Consider adding a general error state or showing error message from backend if available
        submit:
          error.message ||
          (editMode
            ? t.toasts?.compoundUpdateFailed ||
              "Failed to update compound. Please try again."
            : t.toasts?.compoundAddFailed ||
              "Failed to add compound. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDeveloper = (newDeveloper) => {
    setDevelopers([...developers, newDeveloper]);

    setFormData((prev) => {
      return {
        ...prev,
        developer_name: newDeveloper,
      };
    });
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          editMode
            ? t.updateProject
            : t.modal?.addNewProject || "Add New Project"
        }
      >
        <div>
          <div className="space-y-2">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.compoundName || "Compound Name"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                rows={2}
                disabled={editMode}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.description || "Description"}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.city || "City"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {editMode ? formData.city : t.formLabels?.selectCity}
                  </option>
                  {Egypt_cities?.map((gov) => (
                    <option key={gov?.governorate} value={gov?.governorate}>
                      {gov?.governorate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.country || "Country"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.district || "District"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.city || editMode}
                className={`block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  !formData.city ? "bg-gray-100" : ""
                }`}
              >
                <option value="">
                  {!formData.city
                    ? ar === "ar"
                      ? "الرجاء اختيار المدينة أولاً"
                      : "Please select a city first"
                    : editMode
                      ? formData.district
                      : ar === "ar"
                        ? t.formLabels?.district
                        : "Select district"}
                </option>
                {formData?.city &&
                  Egypt_cities.find(
                    (gov) => gov.governorate === formData.city
                  )?.districts.map((dist) => (
                    <option key={dist.district} value={dist.district}>
                      {dist.district}
                    </option>
                  ))}
              </select>
              {/* {!formData.city && (
                <p className="mt-1 text-sm text-red-600">
                  {ar === "ar" ? "الرجاء اختيار المدينة أولاً" : "Please select a city first"}
                </p>
              )} */}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.area || "Area (m²)"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  placeholder="1000"
                  onChange={handleChange}
                  min="0"
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  id="gated"
                  name="gated"
                  checked={formData.gated}
                  onChange={handleChange}
                  disabled={editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="gated"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t.formLabels?.gatedCommunity || "Gated Community"}
                </label>
              </div>
            </div>

            {/* Developer */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-1`}>
                {t.formLabels?.developer || "Developer"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="developer_name"
                  value={formData.developer_name}
                  onChange={handleChange}
                  disabled={editMode}
                  className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none`}
                >
                  <option value="">
                    {editMode
                      ? formData.developer_name
                      : t.formLabels?.selectDeveloper || "Select developer"}
                  </option>
                  {developers?.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div
                  className={`absolute inset-y-0 ${ar === "ar" ? "left-0" : "right-0"} flex items-center px-2 pointer-events-none`}
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {!editMode && (
                <button
                  type="button"
                  onClick={() => setIsAddDeveloperDialogOpen(true)}
                  className={`absolute ${ar === "ar" ? "left-0" : "right-0"} top-0 text-blue-600 text-sm font-medium`}
                >
                  + {t.buttons?.addNew || "Add New"}
                </button>
              )}
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.videoURL || "Video URL"}
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://example.com/video"
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.googleMapsLink || "Google Maps Link"}
              </label>
              <input
                type="url"
                name="google_map_link"
                value={formData.google_map_link}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                disabled={editMode}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                          src={formData.master_plan || selectedImage?.preview}
                          alt={`Image ${selectedImage.name}`}
                          className="w-full h-full object-cover rounded-md"
                        />

                        {/* Status Overlay */}
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

                        {/* Success indicator for uploaded images */}
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

                        {/* Delete button - only show if not currently processing */}
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

                      {/* Image label */}
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
                  t.updateProject
                ) : (
                  t.buttons?.saveProject || "Save Project"
                )}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <AddDeveloperDialog
        client_id={clientId}
        isOpen={isAddDeveloperDialogOpen}
        onClose={() => setIsAddDeveloperDialogOpen(false)}
        onAdd={handleAddDeveloper}
      />
    </>
  );
}
