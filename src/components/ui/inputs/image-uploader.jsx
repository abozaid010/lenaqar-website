'use client';

import ImageWithLoader from "@/components/ui/image-with-loader";
import { useI18n } from "@/hooks/useI18n";
import { deleteImage, uploadImages } from "@/utils/api";
import { processImage } from "@/utils/processImage";
import {
  getMaxSizeBytes,
  getMaxSizeMB,
  isSupportedImageFile,
  SUPPORTED_IMAGE_ACCEPT,
} from "@/config/imageUpload";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

/** Resolve GCS file id from API fields or URL path (/gcs/… or /images/…). */
function resolveImageFileId(img) {
  if (!img || typeof img !== "object") return "";
  const direct = img.fileId ?? img.file_id ?? img.id;
  if (direct) return String(direct);
  const url = img.url || img.image_url || "";
  if (!url) return "";
  const match = String(url).match(/\/(gcs|images)\/([^/?#]+)/);
  return match ? match[2] : "";
}

/** Stable per-image key for React keys and delete — never rely on empty fileId alone. */
function getImageIdentity(img) {
  const fileId = resolveImageFileId(img);
  if (fileId) return fileId;
  return img?.url || img?.image_url || "";
}

function normalizeUploaderImage(img) {
  const url = img?.url || img?.image_url || "";
  const fileId = resolveImageFileId(img) || getImageIdentity(img);
  return {
    ...(img?.source ? { source: img.source } : {}),
    url,
    fileId,
  };
}

function sanitizeImagesForParent(images) {
  return images.map(({ preview, name, id, ...rest }) => rest);
}

export default function ImageUploader({
  maxImages = 8,
  initialImages = [],
  imageType = "normal", // 'normal' | 'masterPlan' (campaigns use 10MB via masterPlan)
  onImagesChange = () => {},
  isUploading,
  setIsUploading,
}) {
  const clinetId = LenaCookiesManager.getClientId() || "";

  const { t, translate } = useI18n();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState(() =>
    (Array.isArray(initialImages) ? initialImages : [])
      .map(normalizeUploaderImage)
      .filter((img) => img.url)
  );
  const [uploadStatus, setUploadStatus] = useState({});

  // Sync when initialImages changes (e.g. opening edit with existing images)
  useEffect(() => {
    const normalized = (Array.isArray(initialImages) ? initialImages : [])
      .map(normalizeUploaderImage)
      .filter((img) => img.url);
    setUploadedImages(normalized);
  }, [initialImages]);

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
      toast.error(
        String(t.maxImagesError).replace("{max}", String(maxImages))
      );
      return;
    }
    const newSelectedImages = [];
    const newUploadStatus = { ...uploadStatus };
    const maxSizeBytes = getMaxSizeBytes(imageType);
    const maxSizeMB = getMaxSizeMB(imageType);
    for (const file of Array.from(files)) {
      if (!isSupportedImageFile(file)) {
        toast.error(t.invalidFileType);
        continue;
      }
      if (file.size > maxSizeBytes) {
        const tpl =
          t?.common?.fileSizeExceedsMb ||
          "File size exceeds {mb}MB. Please upload a smaller image.";
        toast.error(
          `${file.name} - ${String(tpl).replace("{mb}", String(maxSizeMB))}`
        );
        continue;
      }
      const imageId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      newSelectedImages.push({
        id: imageId,
        file,
        name: file.name,
      });
      newUploadStatus[imageId] = "uploading";
    }
    setSelectedImages((prev) => [...prev, ...newSelectedImages]);
    setUploadStatus(newUploadStatus);
    setIsUploading(true);

    const successfulUploads = [];
    const failedUploads = [];
    for (const image of newSelectedImages) {
      try {
        // Set status to compressing first
        setUploadStatus((prev) => ({ ...prev, [image.id]: "compressing" }));
        
        // Process image with unified compression
        const processedFile = await processImage(image.file, { 
          allowLarger: imageType === "masterPlan" 
        });
        
        // Update status to uploading
        setUploadStatus((prev) => ({ ...prev, [image.id]: "uploading" }));
        
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", processedFile);
        const res = await uploadImages(formDataToUpload, clinetId);
        if (!res?.url) {
          throw new Error(
            t?.common?.imageUploadFailed ||
              t?.failedToUploadImage ||
              "Image upload failed. Please try again."
          );
        }
        setUploadStatus((prev) => ({ ...prev, [image.id]: "success" }));
        successfulUploads.push({
          url: res.url,
          fileId: res.fileId,
          id: image.id,
        });
      } catch (error) {
        setUploadStatus((prev) => ({ ...prev, [image.id]: "error" }));
        failedUploads.push(image.id);
        console.error(`Failed to upload image ${image.name}:`, error?.message ?? error);
      }
    }
    const mergedUploads = [...uploadedImages, ...successfulUploads].map(
      normalizeUploaderImage
    );
    setUploadedImages(mergedUploads);
    onImagesChange(sanitizeImagesForParent(mergedUploads));

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

  const removeUploadedImage = async (identity) => {
    const newUploadedImages = uploadedImages.filter(
      (image) => getImageIdentity(image) !== identity
    );
    setUploadedImages(newUploadedImages);
    onImagesChange(sanitizeImagesForParent(newUploadedImages));

    const gcsId = resolveImageFileId({ fileId: identity, url: identity });
    if (!gcsId || gcsId.startsWith("http://") || gcsId.startsWith("https://")) {
      return;
    }

    try {
      await deleteImage(gcsId);
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
    const imageId = isSelected ? image.id : getImageIdentity(image);
    const isProcessing = isSelected && (uploadStatus[imageId] === "uploading" || uploadStatus[imageId] === "compressing");
    return (
      <div key={imageId} className="relative aspect-square">
        <div className="relative w-full h-full">
          <ImageWithLoader
            src={getDisplayImageUrl(image.url) || "/images/defaultImage.jpg"}
            alt={
              image.name
                ? `Image ${image.name}`
                : image.fileId
                  ? `Image ${image.fileId}`
                  : "Campaign image"
            }
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
            <div className="absolute top-1 start-1 z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
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
              aria-label={translate("common.delete", "Delete")}
              className="icon-btn absolute top-1 end-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
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
        accept={SUPPORTED_IMAGE_ACCEPT}
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
