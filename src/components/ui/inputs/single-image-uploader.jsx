import {
  deleteImage,
  uploadImages,
} from "@/components/services/serviceFetching";
import { useI18n } from "@/context/translate-api";
import { compressImage } from "@/utils/imageCompression";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function SingleImageUploader({
  label,
  value,
  onChange,
  disabled = false,
  uploading = false,
  setUploading,
  placeholder,
}) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(
    value ? { name: null, preview: value, imageId: null } : null
  );
  const [isUploading, setIsUploadingLocal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      setSelectedImage(null);
    } else {
      setSelectedImage({ name: null, preview: value, imageId: null });
    }
  }, [value]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];

    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB. Please select a smaller file.");
      return;
    }
    if (file && !["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Invalid file type. Please select a JPEG or PNG image.");
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
      setIsUploadingLocal(true);
      setUploading?.(true);

      const compressedFile = await compressImage(file);

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", compressedFile);

      const res = await uploadImages(formDataToUpload);

      if (res && res.url) {
        setSelectedImage((prev) => ({ ...(prev || {}), imageId: res.fileId }));
        onChange(res.url);
      } else {
        toast.error("Image upload failed. Please try again.");
        setSelectedImage(null);
        onChange("");
      }
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingLocal(false);
      setUploading?.(false);
    }
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation();

    const imageID = selectedImage.preview.split("/").pop();
    if (!imageID) return;

    try {
      setDeleteLoading(true);
      await deleteImage(imageID);
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setDeleteLoading(false);
    }

    setSelectedImage(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading || uploading}
      />
      <div
        onClick={() =>
          !disabled && !isUploading && fileInputRef.current.click()
        }
        className="w-full mt-2"
        style={{
          cursor:
            disabled || isUploading || deleteLoading
              ? "not-allowed"
              : "pointer",
        }}
      >
        {selectedImage || value ? (
          <div className="relative group w-full flex flex-col gap-1 items-center justify-center">
            <div className="relative w-full h-[240px]">
              <Image
                fill
                priority={true}
                src={selectedImage?.preview || value}
                alt={`Image ${selectedImage?.name || "uploaded"}`}
                className="rounded-md"
                objectFit="cover"
              />

              {(isUploading || uploading) && (
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}

              {!isUploading && !uploading && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={deleteLoading}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity disabled:pointer-events-none disabled:cursor-auto"
                >
                  {deleteLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
              {selectedImage?.name}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full min-h-[200px] bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
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
              {placeholder ||
                t?.formLabels?.dragDropImage ||
                "Click or drag and drop an image here"}
            </p>
            <p className="text-xs text-gray-500">
              {t?.formLabels?.supportedFormats ||
                "Supported formats: JPG or PNG (Max 5MB each)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
