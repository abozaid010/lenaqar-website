import React from "react";
import { Trash2, Upload } from "lucide-react";

const ImagesSection = ({
  formData,
  selectedFiles,
  uploadingImages,
  fileInputRef,
  handleDragOver,
  handleDrop,
  handleFileSelection,
  handleImageUpload,
  removeSelectedFile,
  removeUploadedImage
}) => {
    console.log(formData)
  return (
    <div className="mb-8 ">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Property Images
      </h3>

      {/* Drag and drop area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelection(e.target.files)}
          className="hidden"
          multiple
          accept="image/*"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop images here, or click to select files
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports: JPG, PNG, GIF (Max 5MB each)
        </p>
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Images ({selectedFiles.length}):
            </h4>
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={uploadingImages}
              className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {uploadingImages ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" /> Upload All
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Selected ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded images */}
      {formData.images && formData.images.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">
            Uploaded Images ({formData.images.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div
                key={index}
                className="relative group  rounded-lg overflow-hidden"
              >
                <img
                  src={image.url || image.url}
                  alt={`Property ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
             
                <div className="absolute inset-0  group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(index, image._id)}
                    className="p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden fields */}
      <input
        type="hidden"
        name="dataSource"
        value={formData.dataSource || "website"}
      />
      <input type="hidden" name="clientId" value={formData.clientId} />
      <input type="hidden" name="clientName" value={formData.clientName} />
    </div>
  );
};

export default ImagesSection;