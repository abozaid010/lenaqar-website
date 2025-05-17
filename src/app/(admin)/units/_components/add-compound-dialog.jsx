"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { compressImage } from "@/utils/imageCompression";
import Dialog from "../_components/dialog";
import { Loader2 } from "lucide-react";
import {
  addCompound,
  deleteImage,
  uploadImages,
  getprojects,
} from "@/components/services/serviceFetching";
import toast from "react-hot-toast";
import AddDeveloperDialog from "./add-developer-dialog";

import { useRouter } from "next/navigation";
import { useI18n } from "@/context/translate-api";
import Cookies from "js-cookie";


export default function AddCompoundDialog({
  clientId,
  isOpen,
  onClose,
  onAdd,
  developers = [],
  setDevelopers,
  Egypt_cities,
  defaultCity,
  defaultDistrict,
}) {

  const router = useRouter();
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
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [dataProject, setDataProject] = useState([]);

  const getProjectByCityAndDistrict = async (city, district) => {
    if (city && district) {
      try {
        setIsLoadingProjects(true);
        const data = await getprojects(city, district);
        setDataProject(data);
      } catch (error) {
        console.log(error);
        setDataProject([]);
      } finally {
        setIsLoadingProjects(false);
      }
    }
  };

  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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

    // If district changes and city is available, fetch projects
    if (name === "district" && formData.city && value) {
      getProjectByCityAndDistrict(formData.city, value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {

      newErrors.name = t.formValidation?.compoundNameRequired || "Compound name is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = t.formValidation?.cityRequired || "City is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = t.formValidation?.countryRequired || "Country is required";
    }

    if (!formData.district.trim()) {
      newErrors.district = t.formValidation?.districtRequired || "District is required";
    }

    if (formData.area && (isNaN(formData.area) || Number(formData.area) <= 0)) {
      newErrors.area = t.formValidation?.areaPositive || "Area must be a positive number";

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
        toast.success(t.toasts?.imageRemoved || "Image removed successfully from the server!");
        setUploadedImageId(null);
      } catch (error) {
        toast.error(
          t.toasts?.imageRemoveFailed || "Failed to remove image from the server. Please try again."
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


  const handleUpload = async () => {
    if (!selectedImage) {
      toast.error(t.toasts?.selectImage || "Please select an image to upload.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await uploadImages(formData);
      setUploadedImageId(res.fileId);
      setFormData((prev) => ({
        ...prev,
        master_plan: res.url,
      }));

      toast.success(t.toasts?.imageUploaded || "Image uploaded successfully!");
      setSelectedImage(null);
    } catch (error) {
      toast.error(t.toasts?.imageUploadFailed || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
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
      const submissionData = {
        ...formData,
        area: Number(formData.area),
      };

      const res = await addCompound(submissionData);
      if (res.code === 200) {
        toast.success(t.toasts?.compoundAdded || "Compound added successfully!");

        onAdd({
          name: res.data?.name,
          id: res.data?.id,
        });
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

        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        setSelectedImage(null);
        onClose();
      } else {
        toast.error(t.toasts?.compoundAddFailed || "Failed to add compound. Please try again.");
      }
    } catch (error) {
      toast.error(t.toasts?.compoundAddFailed || "Failed to add compound. Please try again.");
      setErrors({ submit: t.toasts?.compoundAddFailed || "Failed to add compound. Please try again." });
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

  // Add this useEffect to update the form data when defaultCity or defaultDistrict change
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      city: defaultCity || "",
      district: defaultDistrict || "",
    }));

    // Fetch projects when component loads if city and district are available
    if (defaultCity && defaultDistrict) {
      getProjectByCityAndDistrict(defaultCity, defaultDistrict);
    }
  }, [defaultCity, defaultDistrict]);

  return (
    <>

      <Dialog isOpen={isOpen} onClose={onClose} title="Add New Project">
        <div className="space-y-2">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compound Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>

              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select City</option>
                {Egypt_cities.countries[0].governorates?.map((gov) => (
                  <option key={gov?.governorate} value={gov?.governorate}>
                    {gov?.governorate}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">

                {t.formLabels?.description || "Description"}

              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>


            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.city || "City"} <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.formLabels?.selectCity || "Select City"}</option>
                  {Egypt_cities.countries[0].governorates?.map((gov) => (
                    <option key={gov?.governorate} value={gov?.governorate}>
                      {gov?.governorate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.country || "Country"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>


          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">

                {t.formLabels?.district || "District"} <span className="text-red-500">*</span>

              </label>
              <input
                type="number"
                name="area"
                value={formData.area}
                placeholder="1000"
                onChange={handleChange}
                min="0"
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"

              >
                <option value="">
                  {formData.city ? (t.formLabels?.selectDistrict || "Select District") : (t.formLabels?.cityFirst || "Select City First")}
                </option>
                {formData.city &&
                  Egypt_cities.countries[0].governorates
                    .find((gov) => gov.governorate === formData.city)
                    ?.districts.map((dist) => (
                      <option key={dist.district} value={dist.district}>
                        {dist.district}
                      </option>
                    ))}
              </select>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.area || "Area (m²)"}
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  placeholder="1000"
                  onChange={handleChange}
                  min="0"
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
          </div>

          {/* Developer */}
          <div className="relative">
            <label className={`block text-sm font-medium mb-1`}>
              Developer <span className="text-red-500">*</span>
            </label>
            <div className="relative">

              <label className={`block text-sm font-medium mb-1`}>
                {t.formLabels?.developer || "Developer"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="developer_name"
                  value={formData.developer_name}
                  onChange={handleChange}
                  className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none`}
                >
                  <option value="">{t.formLabels?.selectDeveloper || "Select developer"}</option>
                  {developers.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
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
              <button
                type="button"
                onClick={() => setIsAddDeveloperDialogOpen(true)}
                className={`absolute ${ar === "ar" ? "left-0" : "right-0"} top-0 text-blue-600 text-sm font-medium`}
              >
                + {t.buttons?.addNew || "Add New"}
              </button>

            </div>
            <button
              type="button"
              onClick={() => setIsAddDeveloperDialogOpen(true)}
              className="absolute right-0 top-0 text-blue-600 text-sm font-medium"
            >
              + Add New
            </button>
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
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.masterPlanImage || "Master Plan Image"}
              </label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
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
                    <div className="relative">
                      <img
                        src={
                          selectedImage
                            ? URL.createObjectURL(selectedImage)
                            : formData.master_plan
                        }
                        alt={t.formLabels?.selectedImage || "Selected"}
                        className="w-full h-full max-h-32 object-cover rounded-md"

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
                      <p className="text-lg text-gray-700 mb-2">
                        {t.formLabels?.dragDropImage || "Click or drag and drop an image here"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t.formLabels?.supportedFormats || "Supported formats: JPG, PNG, WEBP (Max 5MB each)"}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {selectedImage && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`flex items-center gap-2 font-medium py-1.5 px-6 rounded-md transition-colors ${
                      isUploading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary hover:opacity-90 text-white"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        {t.buttons?.uploading || "Uploading..."}
                      </>
                    ) : (
                      t.buttons?.uploadImage || "Upload Image"
                    )}
                  </button>
                </div>
              )}
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
                    {t.buttons?.saving || "Saving..."}
                  </div>
                ) : (
                  t.buttons?.saveProject || "Save Project"

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
              Cancel
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
                  Saving...
                </div>
              ) : (
                "Save Project"
              )}
            </button>
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
