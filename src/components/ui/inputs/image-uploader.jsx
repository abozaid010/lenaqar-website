'"use client";';

import ImageWithLoader from "@/components/ui/image-with-loader";
import { useI18n } from "@/context/translate-api";
import { deleteImage, uploadImages } from "@/utils/api";
import { compressImage } from "@/utils/imageCompression";
import Cookies from "js-cookie";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

export default function ImageUploader({
  maxImages = 8,
  initialImages = [],
  onImagesChange = () => {},
  isUploading,
  setIsUploading,
}) {
  const clinetId = Cookies.get("lena-website-client_id") || "";

  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState(initialImages);
  const [uploadStatus, setUploadStatus] = useState({});

  const totalImagesCount = selectedImages.length + uploadedImages.length;

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
    if (
      selectedImages.length + uploadedImages.length + files.length >
      maxImages
    ) {
      toast.error(t.maxImagesError);
      return;
    }
    const newSelectedImages = [];
    const newUploadStatus = { ...uploadStatus };
    for (const file of Array.from(files)) {
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        toast.error(t.invalidFileType);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}_${t.fileSizeExceeds}`);
        continue;
      }
      const imageId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      newUploadStatus[imageId] = "uploading";
    }
    setSelectedImages((prev) => [...prev, ...newSelectedImages]);
    setUploadStatus(newUploadStatus);
    setIsUploading(true);

    const successfulUploads = [];
    const failedUploads = [];
    for (const image of newSelectedImages) {
      try {
        const compressedFile = await compressImage(image.file);
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", compressedFile);
        const res = await uploadImages(formDataToUpload, clinetId);
        setUploadStatus((prev) => ({ ...prev, [image.id]: "success" }));
        successfulUploads.push({
          url: res.url,
          fileId: res.fileId,
          preview: image.preview,
          name: image.name,
        });
      } catch (error) {
        setUploadStatus((prev) => ({ ...prev, [image.id]: "error" }));
        failedUploads.push(image.id);
        console.error(`Failed to upload image ${image.name}:`, error);
      }
    }
    const sanitizedUploads = [...uploadedImages, ...successfulUploads].map(
      ({ preview, name, ...rest }) => rest
    );
    setUploadedImages([...uploadedImages, ...successfulUploads]);
    onImagesChange(sanitizedUploads);

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
      onImagesChange(newUploadedImages);
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

  const renderImageItem = (image, isSelected = false) => {
    const imageId = isSelected ? image.id : image.fileId;
    const isProcessing = isSelected && uploadStatus[imageId] === "uploading";
    return (
      <div key={imageId} className="relative group aspect-square">
        <div className="relative w-full h-full">
          <ImageWithLoader
            src={image.preview || image.url || "/placeholder.svg"}
            alt={`Image ${image.name}`}
            className="w-full h-full object-cover rounded-md"
            priority={false}
            loadingVariant="minimal"
            sizes="200px"
          />
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
        {isSelected && (
          <div className="mt-1 text-xs text-gray-500 truncate">
            {image.name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="mt-2">
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {uploadedImages.map((image) => renderImageItem(image, false))}
          {selectedImages.map((image) => renderImageItem(image, true))}
          {totalImagesCount < maxImages && (
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
        <p className="mt-2 text-xs text-gray-500">{t.supportedFormats}</p>
      </div>
    </div>
  );
}
