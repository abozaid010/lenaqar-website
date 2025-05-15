"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useI18n } from "@/context/translate-api";
import { compressImage } from "@/utils/imageCompression";

import AddDeveloperDialog from "../add-developer-dialog";
import {
  deleteImage,
  uploadImages,
} from "@/components/services/serviceFetching";

export default function ImagesStep({
  formData,
  updateFormData,
  developersSet,
  isUploading,
  setIsUploading,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const fileInputRef = useRef(null);
  const { t } = useI18n();

  const [dragActive, setDragActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState(formData.images || []);
  // Track upload status for each image
  const [uploadStatus, setUploadStatus] = useState({});

  const [developers, setDevelopers] = useState(Array.from(developersSet) || []);
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);

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

  const handleFiles = async (files) => {
    if (selectedImages.length + uploadedImages.length + files.length > 8) {
      toast.error(t.maxImagesError);
      return;
    }

    const newSelectedImages = [];
    const newUploadStatus = { ...uploadStatus };

    // First, create preview and add to selected images
    for (const file of Array.from(files)) {
      // Check file type
      if (
        !file.type.match("image/jpeg") &&
        !file.type.match("image/png") &&
        !file.type.match("image/webp")
      ) {
        toast.error(t.invalidFileType);
        continue;
      }

      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}_${t.fileSizeExceeds}`);
        continue;
      }

      const imageId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // INFO: Create a promise for reading the file, WHY?
      // Ensures that each file is processed (read and preview generated) before moving to the next file.
      const readFilePromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: imageId,
            file,
            preview: e.target.result,
            name: file.name,
          };
          newSelectedImages.push(imageData);
          resolve(imageData);
        };
        reader.readAsDataURL(file);
      });

      await readFilePromise;

      // Set status to uploading immediately
      newUploadStatus[imageId] = "uploading";
    }
    // Update state with new images and upload status
    setSelectedImages((prev) => [...prev, ...newSelectedImages]);
    setUploadStatus(newUploadStatus);

    // Start uploading each image
    setIsUploading(true);

    const successfulUploads = [];
    const failedUploads = [];

    // Process each selected image
    for (const image of newSelectedImages) {
      try {
        // Compress the image before uploading
        const compressedFile = await compressImage(image.file);

        const formDataToUpload = new FormData();
        formDataToUpload.append("file", compressedFile);

        const res = await uploadImages(formDataToUpload);

        // Update status to success
        setUploadStatus((prev) => {
          return { ...prev, [image.id]: "success" };
        });

        // Add to successful uploads
        successfulUploads.push({
          url: res.url,
          fileId: res.fileId,
          preview: image.preview,
        });
      } catch (error) {
        setUploadStatus((prev) => {
          return { ...prev, [image.id]: "error" };
        });

        failedUploads.push(image.id);
        console.error(`Failed to upload image ${image.name}:`, error);
      }
    }

    const sanitizedUploads = [...uploadedImages, ...successfulUploads].map(
      ({ preview, ...rest }) => rest
    );

    setUploadedImages([...uploadedImages, ...successfulUploads]);
    updateFormData({ images: sanitizedUploads });

    // Remove successfully uploaded images from selectedImages
    const remainingSelected = selectedImages.filter(
      (img) => !successfulUploads.some((upload) => upload.id === img.id)
    );
    const newSelected = newSelectedImages.filter((img) =>
      failedUploads.includes(img.id)
    );
    setSelectedImages([...remainingSelected, ...newSelected]);

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
      toast.success(t.imageDeletedSuccess);
    } catch (error) {
      toast.error(t.failedToDeleteImage);
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

  const handleAddDeveloper = (newDeveloper) => {
    setDevelopers([...developers, newDeveloper]);
    updateFormData({ developer: newDeveloper });
  };

  // Helper function to render image item
  const renderImageItem = (image, isSelected = false) => {
    const imageId = isSelected ? image.id : image.fileId;
    const isProcessing = isSelected && uploadStatus[imageId] === "uploading";

    return (
      <div key={imageId} className="relative group aspect-square">
        <div className="relative w-full h-full">
          <Image
            fill
            priority={true}
            src={image.preview || image.url || "/placeholder.svg"}
            alt={`Image ${image.name}`}
            className="w-full h-full object-cover rounded-md"
          />

          {/* Status Overlay */}
          {isSelected && uploadStatus[imageId] && (
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-md ${
                uploadStatus[imageId] === "compressing"
                  ? "bg-yellow-500/50"
                  : uploadStatus[imageId] === "uploading"
                    ? "bg-black/50"
                    : uploadStatus[imageId] === "success"
                      ? "bg-green-500/50"
                      : "bg-red-500/50"
              }`}
            >
              {uploadStatus[imageId] === "uploading" && (
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
              {uploadStatus[imageId] === "success" && (
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
              {uploadStatus[imageId] === "error" && (
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
                      retryFailedUpload(imageId);
                    }}
                    className="bg-white text-red-500 text-xs font-medium py-1 px-2 rounded"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success indicator for uploaded images */}
          {!isSelected && (
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
          {!isProcessing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected) {
                  removeSelectedImage(imageId);
                } else {
                  removeUploadedImage(imageId);
                }
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

        {/* Image label */}
        <div className="mt-1 text-xs text-gray-500 truncate">{image.name}</div>
      </div>
    );
  };

  const totalImagesCount = selectedImages.length + uploadedImages.length;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        {t.additionalDetails}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        {/* Finishing Type */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("finishing")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.finishingType} <span className="text-red-500">*</span>
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
              <option value="">{t.selectFinishingType}</option>
              <option value="fully finished">{t.fullyFinished}</option>
              <option value="semi finished">{t.semiFinished}</option>
              <option value="core & shell">{t.coreAndShell}</option>
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

        {/* Furnishing Type */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("furnishing")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Furnishing Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="furnishing"
              value={formData.furnishing}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("furnishing")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">Select Furnishing Type</option>
              <option value="furnished">{t.furnished}</option>
              <option value="unfurnished">{t.unfurnished}</option>
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
        {formData.purpose === "sell" && (
          <div className="relative">
            <label
              className={`block text-sm font-medium mb-1 ${
                invalidFields.includes("developer")
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
            >
              {t.developer} <span className="text-red-500">*</span>
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
        )}
      </div>

      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        {t.propertyImages}{" "}
        <span className="text-sm font-normal text-gray-500">
          ({totalImagesCount} / 8)
        </span>
      </h3>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Grid with Add More Button */}
      <div className="mt-4">
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Render uploaded images first */}
          {uploadedImages.map((image) => renderImageItem(image, false))}

          {/* Render selected (not yet uploaded) images */}
          {selectedImages.map((image) => renderImageItem(image, true))}

          {/* Add More Button - only show if less than 8 images */}
          {totalImagesCount < 8 && (
            <div
              onClick={openFileDialog}
              className={`aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${dragActive ? "bg-blue-50" : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="mt-2 text-sm text-gray-500">
                {t.common.addImage}
              </span>
            </div>
          )}
        </div>

        {/* Upload Status Indicator */}
        {isUploading && (
          <div className="mt-4 flex items-center gap-2 justify-center text-primary">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
            <span>{t.common.ProcessingImages}</span>
          </div>
        )}

        {/* Help text */}
        <p className="mt-2 text-xs text-gray-500">{t.supportedFormats}</p>
      </div>

      <AddDeveloperDialog
        isOpen={isAddDeveloperDialogOpen}
        onClose={() => setIsAddDeveloperDialogOpen(false)}
        onAdd={handleAddDeveloper}
      />
    </div>
  );
}
