"use client";

import { useState, useRef } from "react";
import Dialog from "../_components/dialog";
import { Loader2 } from "lucide-react";
import {
  addCompound,
  deleteImage,
  uploadImages,
} from "@/components/services/serviceFetching";
import toast from "react-hot-toast";
import AddDeveloperDialog from "./add-developer-dialog";

export default function AddCompoundDialog({
  clientId,
  isOpen,
  onClose,
  onAdd,
  developers = [],
  setDevelopers,
}) {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    developer_name: "",
    city: "",
    country: "Egypt",
    district: "",
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Compound name is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.district.trim()) {
      newErrors.district = "District is required";
    }

    if (formData.area && (isNaN(formData.area) || Number(formData.area) <= 0)) {
      newErrors.area = "Area must be a positive number";
    }

    return newErrors;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation();

    if (uploadedImageId) {
      try {
        await deleteImage(uploadedImageId);
        toast.success("Image removed successfully from the server!");
        setUploadedImageId(null);
      } catch (error) {
        toast.error(
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

  const handleUpload = async () => {
    if (!selectedImage) {
      toast.error("Please select an image to upload.");
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

      toast.success("Image uploaded successfully!");
      setSelectedImage(null);
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
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
        toast.success("Compound added successfully!");
        onAdd({
          name: res.data?.name,
          id: res.data?.id,
        });
        onClose();
        setFormData({
          name: "",
          description: "",
          developer_name: "",
          city: "",
          country: "Egypt",
          district: "",
          area: "",
          gated: false,
          video_url: "",
          google_map_link: "",
          master_plan: "",
        });
      } else {
        toast.error("Failed to add compound. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to add compound. Please try again.");
      setErrors({ submit: "Failed to add compound. Please try again." });
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
      <Dialog isOpen={isOpen} onClose={onClose} title="Add New Project">
        <div>
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
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (m²)
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
                  Gated Community
                </label>
              </div>
            </div>

            {/* Developer */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-1`}>
                Developer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="developer_name"
                  value={formData.developer_name}
                  onChange={handleChange}
                  className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none`}
                >
                  <option value="">Select developer</option>
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
                className="absolute right-0 top-0 text-blue-600 text-sm font-medium"
              >
                + Add New
              </button>
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
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
                Google Maps Link
              </label>
              <input
                type="url"
                name="google_map_link"
                value={formData.google_map_link}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Master Plan Image
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
                        alt="Selected"
                        className="w-full h-full max-h-32 object-cover rounded-md"
                      />
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
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
                        Click or drag and drop an image here
                      </p>
                      <p className="text-sm text-gray-500">
                        Supported formats: JPG, PNG, WEBP (Max 5MB each)
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
                        Uploading...
                      </>
                    ) : (
                      "Upload Image"
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
