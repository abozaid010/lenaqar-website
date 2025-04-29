"use client";

import { Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

import {
  deleteImage,
  uploadImages,
} from "@/components/services/serviceFetching";

export default function ImagesStep({
  formData,
  updateFormData,
  developers,
  isUploading,
  setIsUploading,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState(formData.images || []);
  // Track upload status for each image
  const [uploadStatus, setUploadStatus] = useState({});

  const developersSet = Array.from(
    new Set(developers?.map((developer) => developer.name))
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });

    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    if (selectedImages.length + uploadedImages.length + files.length > 8) {
      toast.error(
        "You can only upload a maximum of 8 images. Please remove some images before adding new ones."
      );
      return;
    }

    const newSelectedImages = [...selectedImages];

    Array.from(files).forEach((file) => {
      // Check file type
      if (
        !file.type.match("image/jpeg") &&
        !file.type.match("image/png") &&
        !file.type.match("image/webp")
      ) {
        toast.error(
          "Invalid file type. Please upload JPG, PNG, or WEBP images."
        );
        return;
      }

      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB. Please upload smaller images.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        newSelectedImages.push({
          id: imageId,
          file,
          preview: e.target.result,
          name: file.name,
        });
        setSelectedImages([...newSelectedImages]);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImagesToServer = async () => {
    if (selectedImages.length === 0 || isUploading) return;

    setIsUploading(true);

    // Create a copy of the current status
    const newUploadStatus = { ...uploadStatus };
    const successfulUploads = [];
    const failedUploads = [];

    // Process each selected image
    for (const image of selectedImages) {
      newUploadStatus[image.id] = "uploading";
      setUploadStatus({ ...newUploadStatus });

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", image.file);

      try {
        const res = await uploadImages(formDataToUpload);

        newUploadStatus[image.id] = "success";

        // Add to successful uploads
        successfulUploads.push({
          url: res.url,
          fileId: res.fileId,
        });
      } catch (error) {
        newUploadStatus[image.id] = "error";
        failedUploads.push(image.id);
        toast.error(`Failed to upload image ${image.name}:`, error.message);
      }

      setUploadStatus({ ...newUploadStatus });
    }

    // Update the form data with all uploaded images
    const allUploaded = [...uploadedImages, ...successfulUploads];

    updateFormData({ images: allUploaded });
    setUploadedImages(allUploaded);

    // Remove successfully uploaded images from selectedImages
    const remainingSelected = selectedImages.filter((img) =>
      failedUploads.includes(img.id)
    );
    setSelectedImages(remainingSelected);

    setIsUploading(false);
  };

  const removeSelectedImage = (id) => {
    setSelectedImages(selectedImages.filter((image) => image.id !== id));

    // Also remove from upload status if it exists
    if (uploadStatus[id]) {
      const newUploadStatus = { ...uploadStatus };
      delete newUploadStatus[id];
      setUploadStatus(newUploadStatus);
    }
  };

  const removeUploadedImage = async (id) => {
    try {
      const newUploadedImages = uploadedImages.filter(
        (image) => image.fileId !== id
      );
      setUploadedImages(newUploadedImages);
      updateFormData({ images: newUploadedImages });

      await deleteImage(id);
      toast.success("Image deleted successfully");
    } catch (error) {
      toast.error("Failed to delete image. Please try again.");
    }
  };

  const retryFailedUpload = (imageId) => {
    const image = selectedImages.find((img) => img.id === imageId);
    if (!image) return;

    const newUploadStatus = { ...uploadStatus };
    delete newUploadStatus[imageId];
    setUploadStatus(newUploadStatus);
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  const totalImagesCount = selectedImages.length + uploadedImages.length;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Additional Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Finishing Type */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("finishing")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Finishing Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="finishing"
              value={formData.finishing}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("finishing")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">Select finishing type</option>
              {formData.purpose === "rent" ? (
                <>
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </>
              ) : (
                <>
                  <option value="fully finished">Fully Finished</option>
                  <option value="semi finished">Semi Finished</option>
                  <option value="core & shell">Core & Shell</option>
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </>
              )}
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
        </div>

        {/* Developer */}
        <div className="relative">
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("developer")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Developer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="developer"
              value={formData.developer}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("developer")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">Select developer</option>
              {developersSet.map((d, idx) => (
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
          {/* <button className="absolute right-0 top-0 text-blue-600 text-sm font-medium">
            + Add New
          </button> */}
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        Property Images{" "}
        <span className="text-sm font-normal text-gray-500">(Maximum 8)</span>
      </h3>

      {/* Image Upload Area - Entire area is clickable */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onClick={openFileDialog}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
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
            Click or drag and drop images here
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: JPG, PNG, WEBP (Max 5MB each)
          </p>
        </div>

        {/* Upload button - Only shows when there are selected images */}
        {selectedImages.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadImagesToServer();
              }}
              disabled={isUploading}
              className={`flex items-center gap-2 font-medium py-2 px-6 rounded-md transition-colors ${
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
                <>
                  Upload {selectedImages.length} Selected Image
                  {selectedImages.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Image Preview */}
      <div className="mt-4">
        <p className="text-sm text-gray-500">{totalImagesCount}/8 images</p>

        {/* Selected Images (not yet uploaded) */}
        {selectedImages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Selected Images:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {selectedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="relative">
                    <img
                      src={image.preview || "/placeholder.svg"}
                      alt={`Selected image ${image.name}`}
                      className="w-full h-24 object-cover rounded-md"
                    />

                    {/* Upload Status Indicator */}
                    {uploadStatus[image.id] && (
                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-md ${
                          uploadStatus[image.id] === "uploading"
                            ? "bg-black/50"
                            : uploadStatus[image.id] === "success"
                              ? "bg-green-500/50"
                              : "bg-red-500/50"
                        }`}
                      >
                        {uploadStatus[image.id] === "uploading" && (
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
                        )}
                        {uploadStatus[image.id] === "success" && (
                          <svg
                            className="h-8 w-8 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {uploadStatus[image.id] === "error" && (
                          <div className="text-center">
                            <svg
                              className="h-8 w-8 text-white mx-auto mb-1"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                retryFailedUpload(image.id);
                              }}
                              className="bg-white text-red-500 text-xs font-medium py-1 px-2 rounded"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete button - only show if not currently uploading */}
                  {uploadStatus[image.id] !== "uploading" && !isUploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedImage(image.id);
                      }}
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
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Uploaded Images:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.fileId} className="relative group">
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={`Uploaded image ${image.fileId}`}
                      className="w-full h-24 object-cover rounded-md"
                    />

                    {/* Success indicator */}
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
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadedImage(image.fileId);
                    }}
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

                  {/* Image label */}
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
