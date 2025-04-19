import React from "react";
import { Upload, Trash2, CheckCircle, XCircle, Loader } from "lucide-react";

const ImageUploadSection = ({
  formik,
  selectedFiles,
  uploadingImages,
  fileInputRef,
  handleDragOver,
  handleDrop,
  handleFileSelection,
  handleImageUpload,
  removeSelectedFile,
  removeUploadedImage,
  uploadStatus,
}) => {
  // دالة للتحقق مما إذا كانت الصورة قد تم تحميلها
  const isImageUploaded = (file) => {
    return formik.values.images.some((img) => img.name === file.name);
  };
  
  // دالة للتحقق مما إذا كانت الصورة قد فشل تحميلها
  const isImageFailed = (index) => {
    return uploadStatus && uploadStatus[index] === 'failed';
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Property Images
      </h3>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">
          Drag and drop images here, or click to select files
        </p>
        <p className="text-xs text-gray-400">
          Supported formats: JPG, PNG, WEBP (Max 5MB each)
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          id="image-upload"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelection(e.target.files);
            }
          }}
          onClick={(e) => {
            e.target.value = "";
          }}
        />
        <label
          htmlFor="image-upload"
          className="mt-4 inline-block px-4 py-2 bg-primary cursor-pointer hover:bg-primary/90 text-white rounded-lg transition-colors mr-2"
        >
          {selectedFiles.length > 0 ? "Add More Images" : "Select Images"}
        </label>

        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploadingImages}
            className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400  items-center justify-center"
          >
            {uploadingImages ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Images"
            )}
          </button>
        )}
      </div>

      {/* Display selected files waiting to be uploaded */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Images:
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  {uploadStatus && uploadStatus[index] === 'loading' ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md">
                      <Loader className="w-8 h-8 text-white animate-spin" />
                    </div>
                  ) : isImageUploaded(file) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  ) : isImageFailed(index) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                      <XCircle className="w-8 h-8 text-red-500" />
                      <span className="absolute bottom-1 text-xs text-white font-medium">Upload Failed</span>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploadingImages}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display uploaded images */}
      {formik.values.images && formik.values.images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Images:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {formik.values.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeUploadedImage(index, image.fileId)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;