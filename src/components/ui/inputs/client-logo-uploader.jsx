"use client";

import { useI18n } from "@/hooks/useI18n";
import { deleteClientLogo, deleteImage, uploadImages } from "@/utils/api";
import { compressImage } from "@/utils/imageCompression";
import {
  isSupportedImageFile,
  SUPPORTED_IMAGE_ACCEPT,
} from "@/config/imageUpload";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

/** Client logo max size (JPEG, PNG, WebP) per API spec. */
const CLIENT_LOGO_MAX_BYTES = 5 * 1024 * 1024;

async function tryDeleteClientLogo() {
  try {
    await deleteClientLogo();
  } catch (e) {
    console.warn("[ClientLogoUploader] deleteClientLogo:", e);
  }
}

/**
 * Single client logo — same compress / drag-drop / grid tile pattern as unit ImageUploader,
 * with explicit clientId for admin flows. Use deferred + onDeferredFile for signup before the client exists.
 */
export default function ClientLogoUploader({
  clientId,
  deferred = false,
  initialLogoUrl = "",
  initialFileId = "",
  onLogoUrlChange,
  onDeferredFile,
  isUploading,
  setIsUploading,
}) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");
  const [fileId, setFileId] = useState(initialFileId || "");
  const [deferredPreview, setDeferredPreview] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    setLogoUrl(initialLogoUrl || "");
    setFileId(initialFileId || "");
  }, [initialLogoUrl, initialFileId]);

  useEffect(() => {
    return () => {
      if (deferredPreview) URL.revokeObjectURL(deferredPreview);
    };
  }, [deferredPreview]);

  const setLogo = (url, id) => {
    const u = url || "";
    const fid = id || "";
    setLogoUrl(u);
    setFileId(fid);
    onLogoUrlChange?.(u);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  const processFile = async (file) => {
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      toast.error(t.invalidFileType);
      return;
    }
    if (file.size > CLIENT_LOGO_MAX_BYTES) {
      toast.error(
        t?.common?.fileSizeExceedsMb
          ? String(t.common.fileSizeExceedsMb).replace("{mb}", "5")
          : "File too large. Maximum size is 5MB."
      );
      return;
    }

    if (deferred) {
      if (deferredPreview) URL.revokeObjectURL(deferredPreview);
      const url = URL.createObjectURL(file);
      setDeferredPreview(url);
      onDeferredFile?.(file);
      return;
    }

    if (!clientId) {
      toast.error("Client ID is required to upload.");
      return;
    }

    setUploadBusy(true);
    setIsUploading?.(true);
    try {
      const hadExisting = Boolean((logoUrl && logoUrl.trim()) || fileId);
      if (hadExisting) {
        await tryDeleteClientLogo();
        if (fileId) {
          try {
            await deleteImage(fileId);
          } catch (e) {
            console.warn("[ClientLogoUploader] deleteImage before replace:", e);
          }
        }
      }

      const compressedFile = await compressImage(file);
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", compressedFile);
      const res = await uploadImages(formDataToUpload, clientId);
      if (res?.url) {
        setLogo(res.url, res.fileId || "");
      } else {
        toast.error("Image upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Client logo upload failed:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadBusy(false);
      setIsUploading?.(false);
    }
  };

  const removeLogo = async () => {
    if (deferred) {
      if (deferredPreview) URL.revokeObjectURL(deferredPreview);
      setDeferredPreview(null);
      onDeferredFile?.(null);
      return;
    }

    const hadLogo = Boolean((logoUrl && logoUrl.trim()) || fileId);
    if (hadLogo) {
      setIsUploading?.(true);
      try {
        await tryDeleteClientLogo();
        if (fileId) {
          try {
            await deleteImage(fileId);
            toast.success(t.imageDeletedSuccess);
          } catch (err) {
            console.error(err);
            toast.error(t.failedToDeleteImage);
          }
        } else {
          toast.success(t.imageDeletedSuccess);
        }
      } finally {
        setIsUploading?.(false);
      }
    }
    setLogo("", "");
  };

  const displaySrc = deferred
    ? deferredPreview || getDisplayImageUrl(logoUrl) || "/placeholder.svg"
    : getDisplayImageUrl(logoUrl) || "/placeholder.svg";

  const hasLogo = deferred ? !!deferredPreview || !!logoUrl : !!logoUrl;

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_IMAGE_ACCEPT}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="mt-2">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {hasLogo ? (
            <div className="relative group aspect-square">
              <div className="relative w-full h-full">
                {/* Native img: client logos often use GCS hosts not in next/image config */}
                <img
                  src={displaySrc}
                  alt=""
                  className="w-full h-full object-cover rounded-md bg-gray-50"
                  loading="lazy"
                />
                {uploadBusy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                {!uploadBusy && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo();
                    }}
                    className="absolute top-1 end-1 h-6 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </div>
          ) : (
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
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{t.common.ProcessingImages}</span>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">{t.supportedFormats}</p>
        <p className="mt-1 text-xs text-gray-500">Max 5MB</p>
      </div>
    </div>
  );
}
